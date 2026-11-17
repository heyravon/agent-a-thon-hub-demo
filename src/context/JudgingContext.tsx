import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Judge, ScoreEntry, Round, AppConfig, TeamRanking, CategoryScore, JUDGING_CATEGORIES, Team, PRIMARY_ROUNDS, FINAL_ROUNDS, ADVANCEMENT_MAP, FINALISTS_COUNT, getRoundGroup } from '@/types/judging';
import { supabase } from '@/integrations/supabase/client';

export interface JudgeAssignment {
  id: string;
  judgeEmail: string;
  judgeName: string;
  teamNumber: number;
  round: Round;
}

interface JudgingContextType {
  judge: Judge | null;
  setJudge: (j: Judge | null) => void;
  currentRound: Round;
  setCurrentRound: (r: Round) => void;
  scores: ScoreEntry[];
  saveScore: (entry: Omit<ScoreEntry, 'id' | 'timestamp'>) => Promise<void>;
  getScoreForTeam: (teamNumber: number, round: Round) => ScoreEntry | undefined;
  getScoredTeams: (round: Round) => number[];
  getLeaderboard: (round: Round) => TeamRanking[];
  config: AppConfig;
  updateConfig: (c: Partial<AppConfig>) => Promise<void>;
  getAllScores: () => ScoreEntry[];
  resetRoundScores: (round: Round) => Promise<void>;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  teams: Team[];
  allTeams: Team[];
  registerTeam: (team: Omit<Team, 'id' | 'teamNumber' | 'submittedAt' | 'roundGroup'>) => Promise<Team>;
  getTeam: (teamNumber: number) => Team | undefined;
  updateTeam: (teamNumber: number, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamNumber: number) => Promise<void>;
  teamSubmissionsLocked: boolean;
  setTeamSubmissionsLocked: (v: boolean) => Promise<void>;
  loading: boolean;
  assignments: JudgeAssignment[];
  generateAssignments: (round: Round, judges: Judge[]) => Promise<void>;
  clearAssignments: (round: Round) => Promise<void>;
  getAssignedTeams: (round: Round) => number[];
  getJudgePartner: (round: Round) => string | null;
  getKnownJudges: (round?: Round) => Judge[];
  getAllHistoricalJudges: () => Judge[];
  addJudgeToRound: (judge: Judge, round: Round) => Promise<void>;
  removeJudgeFromRound: (email: string, round: Round) => Promise<void>;
  getTeamJudges: (teamNumber: number, round: Round) => string[];
  getDisplayTeamNumber: (teamNumber: number) => number;
  shouldRenumber: boolean;
  reassignJudge: (judgeEmail: string, round: Round, fromTeamNumber: number, toTeamNumber: number) => Promise<void>;
  unassignJudgeFromTeam: (judgeEmail: string, round: Round, teamNumber: number) => Promise<void>;
}

const JudgingContext = createContext<JudgingContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

export function JudgingProvider({ children }: { children: React.ReactNode }) {
  const [judge, setJudgeState] = useState<Judge | null>(loadFromStorage('judge', null));
  const [currentRound, setCurrentRoundState] = useState<Round>(loadFromStorage('currentRound', 'test-primary-1'));
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [config, setConfig] = useState<AppConfig>({ numberOfTeams: 100, lockedRounds: [], activeRound: 'test-primary-1', competitionDayMode: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [teamSubmissionsLocked, setTeamSubmissionsLockedState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);

  // Helper to refresh assignments from DB
  const refreshAssignments = useCallback(async () => {
    const { data } = await supabase.from('judge_assignments').select('*');
    if (data) {
      setAssignments(data.map(a => ({
        id: a.id, judgeEmail: a.judge_email, judgeName: a.judge_name,
        teamNumber: a.team_number, round: a.round as Round,
      })));
    }
  }, []);

  // Get judge pairs from assignments
  const getJudgePairs = useCallback((roundAssignments: { judge_email: string; judge_name: string; team_number: number }[]) => {
    const teamJudges = new Map<number, Set<string>>();
    roundAssignments.forEach(a => {
      const s = teamJudges.get(a.team_number) || new Set();
      s.add(a.judge_email);
      teamJudges.set(a.team_number, s);
    });
    const pairMap = new Map<string, { emails: string[]; teams: number[] }>();
    teamJudges.forEach((judges, teamNum) => {
      const key = [...judges].sort().join('|');
      const existing = pairMap.get(key) || { emails: [...judges].sort(), teams: [] };
      existing.teams.push(teamNum);
      pairMap.set(key, existing);
    });
    return Array.from(pairMap.values());
  }, []);

  const autoAssignJudge = useCallback(async (j: Judge) => {
    const { data: roundAssignments } = await supabase
      .from('judge_assignments')
      .select('*')
      .eq('round', config.activeRound);

    if (!roundAssignments || roundAssignments.length === 0) return;

    const email = j.email.toLowerCase();
    const alreadyAssigned = roundAssignments.some(a => a.judge_email === email);
    if (alreadyAssigned) return;

    const isFinal = FINAL_ROUNDS.includes(config.activeRound);

    if (isFinal) {
      const finalistTeams = [...new Set(roundAssignments.map(a => a.team_number))];
      const newAssignments = finalistTeams.map(teamNum => ({
        judge_email: email, judge_name: j.name,
        team_number: teamNum, round: config.activeRound,
      }));
      if (newAssignments.length > 0) {
        await supabase.from('judge_assignments').insert(newAssignments);
      }
    } else {
      // Primary: check for teams with only 1 judge (unpaired judge waiting for a partner)
      const teamJudgeCounts = new Map<number, string[]>();
      roundAssignments.forEach(a => {
        const judges = teamJudgeCounts.get(a.team_number) || [];
        judges.push(a.judge_email);
        teamJudgeCounts.set(a.team_number, judges);
      });

      const teamsWithOneJudge = Array.from(teamJudgeCounts.entries())
        .filter(([_, judges]) => judges.length === 1);

      if (teamsWithOneJudge.length > 0) {
        // Pair with the unpaired judge on their teams
        const newAssignments = teamsWithOneJudge.map(([teamNum]) => ({
          judge_email: email, judge_name: j.name,
          team_number: teamNum, round: config.activeRound,
        }));
        await supabase.from('judge_assignments').insert(newAssignments);
      } else {
        // Everyone is paired — new judge waits unpaired until another judge arrives
        return;
      }
    }

    await refreshAssignments();
  }, [config.activeRound, refreshAssignments]);

  // Auto-assign a newly registered team to the judge pair with the fewest teams (round-robin)
  const autoAssignTeamToJudges = useCallback(async (teamNumber: number) => {
    const { data: roundAssignments } = await supabase
      .from('judge_assignments')
      .select('*')
      .eq('round', config.activeRound);

    if (!roundAssignments || roundAssignments.length === 0) return;

    const isFinal = FINAL_ROUNDS.includes(config.activeRound);
    if (isFinal) {
      const uniqueJudges = new Map<string, string>();
      roundAssignments.forEach(a => uniqueJudges.set(a.judge_email, a.judge_name));
      const newAssignments = Array.from(uniqueJudges.entries()).map(([je, jn]) => ({
        judge_email: je, judge_name: jn,
        team_number: teamNumber, round: config.activeRound,
      }));
      if (newAssignments.length > 0) {
        await supabase.from('judge_assignments').insert(newAssignments);
      }
    } else {
      const pairs = getJudgePairs(roundAssignments);
      if (pairs.length === 0) return;
      pairs.sort((a, b) => a.teams.length - b.teams.length);
      const leastBusyPair = pairs[0];
      const judgeNames = new Map<string, string>();
      roundAssignments.forEach(a => judgeNames.set(a.judge_email, a.judge_name));
      const newAssignments = leastBusyPair.emails.map(je => ({
        judge_email: je, judge_name: judgeNames.get(je) || je,
        team_number: teamNumber, round: config.activeRound,
      }));
      await supabase.from('judge_assignments').insert(newAssignments);
    }

    await refreshAssignments();
  }, [config.activeRound, refreshAssignments, getJudgePairs]);

  const setJudge = useCallback((j: Judge | null) => {
    setJudgeState(j);
    localStorage.setItem('judge', JSON.stringify(j));
    if (j) {
      supabase.from('judges').upsert(
        { name: j.name, email: j.email.toLowerCase() },
        { onConflict: 'email' }
      );
    }
  }, []);

  const setCurrentRound = useCallback((r: Round) => {
    setCurrentRoundState(r);
    localStorage.setItem('currentRound', JSON.stringify(r));
  }, []);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [teamsRes, scoresRes, configRes, assignRes] = await Promise.all([
        supabase.from('teams').select('*').order('team_number'),
        supabase.from('scores').select('*'),
        supabase.from('app_config').select('*').eq('id', 1).single(),
        supabase.from('judge_assignments').select('*'),
      ]);

      if (teamsRes.data) {
        setAllTeams(teamsRes.data.map(t => ({
          id: t.id,
          teamNumber: t.team_number,
          teamName: t.team_name,
          projectName: t.project_name,
          description: t.description || '',
          members: t.members || [],
          photoUrl: '',
          submittedAt: t.submitted_at,
          roundGroup: (t as any).round_group || 'official',
        })));
      }

      if (scoresRes.data) {
        setScores(scoresRes.data.map(s => ({
          id: s.id,
          judgeName: s.judge_name,
          judgeEmail: s.judge_email,
          teamNumber: s.team_number,
          round: s.round as Round,
          categoryScores: (s.category_scores as any[]) || [],
          totalScore: s.total_score,
          timestamp: s.created_at,
        })));
      }

      if (assignRes.data) {
        setAssignments(assignRes.data.map(a => ({
          id: a.id, judgeEmail: a.judge_email, judgeName: a.judge_name,
          teamNumber: a.team_number, round: a.round as Round,
        })));
      }

      if (configRes.data) {
        setConfig({
          numberOfTeams: configRes.data.number_of_teams,
          lockedRounds: (configRes.data.locked_rounds || []) as Round[],
          activeRound: (configRes.data.active_round || 'test-primary-1') as Round,
          competitionDayMode: configRes.data.competition_day_mode ?? false,
        });
        setTeamSubmissionsLockedState(configRes.data.team_submissions_locked);
        setCurrentRoundState((configRes.data.active_round || 'test-primary-1') as Round);
      }

      setLoading(false);

    };
    fetchAll();

    // Subscribe to realtime changes
    const teamsChannel = supabase.channel('teams-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        supabase.from('teams').select('*').order('team_number').then(({ data }) => {
          if (data) setAllTeams(data.map(t => ({
            id: t.id, teamNumber: t.team_number, teamName: t.team_name,
            projectName: t.project_name, description: t.description || '',
            members: t.members || [], photoUrl: '', submittedAt: t.submitted_at,
            roundGroup: (t as any).round_group || 'official',
          })));
        });
      }).subscribe();

    const scoresChannel = supabase.channel('scores-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        supabase.from('scores').select('*').then(({ data }) => {
          if (data) setScores(data.map(s => ({
            id: s.id, judgeName: s.judge_name, judgeEmail: s.judge_email,
            teamNumber: s.team_number, round: s.round as Round,
            categoryScores: (s.category_scores as any[]) || [],
            totalScore: s.total_score, timestamp: s.created_at,
          })));
        });
      }).subscribe();

    const configChannel = supabase.channel('config-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => {
        supabase.from('app_config').select('*').eq('id', 1).single().then(({ data }) => {
          if (data) {
            setConfig({ numberOfTeams: data.number_of_teams, lockedRounds: (data.locked_rounds || []) as Round[], activeRound: (data.active_round || 'test-primary-1') as Round, competitionDayMode: data.competition_day_mode ?? false });
            setTeamSubmissionsLockedState(data.team_submissions_locked);
            setCurrentRoundState((data.active_round || 'test-primary-1') as Round);
          }
        });
      }).subscribe();

    const assignChannel = supabase.channel('assign-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judge_assignments' }, () => {
        supabase.from('judge_assignments').select('*').then(({ data }) => {
          if (data) setAssignments(data.map(a => ({
            id: a.id, judgeEmail: a.judge_email, judgeName: a.judge_name,
            teamNumber: a.team_number, round: a.round as Round,
          })));
        });
      }).subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(scoresChannel);
      supabase.removeChannel(configChannel);
      supabase.removeChannel(assignChannel);
    };
  }, []);

  const saveScore = useCallback(async (entry: Omit<ScoreEntry, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase.from('scores').upsert({
      judge_name: entry.judgeName,
      judge_email: entry.judgeEmail,
      team_number: entry.teamNumber,
      round: entry.round,
      category_scores: entry.categoryScores as any,
      total_score: entry.totalScore,
    }, { onConflict: 'judge_email,team_number,round' }).select().single();

    if (error) throw error;
    if (data) {
      setScores(prev => {
        const idx = prev.findIndex(s => s.judgeEmail === entry.judgeEmail && s.teamNumber === entry.teamNumber && s.round === entry.round);
        const newEntry: ScoreEntry = {
          id: data.id, judgeName: data.judge_name, judgeEmail: data.judge_email,
          teamNumber: data.team_number, round: data.round as Round,
          categoryScores: (data.category_scores as any[]) || [],
          totalScore: data.total_score, timestamp: data.created_at,
        };
        if (idx >= 0) { const u = [...prev]; u[idx] = newEntry; return u; }
        return [...prev, newEntry];
      });
    }
  }, []);

  const getScoreForTeam = useCallback((teamNumber: number, round: Round) => {
    if (!judge) return undefined;
    return scores.find(s => s.judgeEmail === judge.email && s.teamNumber === teamNumber && s.round === round);
  }, [scores, judge]);

  const getScoredTeams = useCallback((round: Round) => {
    if (!judge) return [];
    return scores.filter(s => s.judgeEmail === judge.email && s.round === round).map(s => s.teamNumber);
  }, [scores, judge]);

  const getLeaderboard = useCallback((round: Round): TeamRanking[] => {
    const roundScores = scores.filter(s => s.round === round);
    const teamMap = new Map<number, { sum: number; count: number; maxSingle: number }>();
    roundScores.forEach(s => {
      const existing = teamMap.get(s.teamNumber) || { sum: 0, count: 0, maxSingle: 0 };
      teamMap.set(s.teamNumber, {
        sum: existing.sum + s.totalScore,
        count: existing.count + 1,
        maxSingle: Math.max(existing.maxSingle, s.totalScore),
      });
    });
    return Array.from(teamMap.entries())
      .map(([teamNumber, { sum, count, maxSingle }]) => ({
        teamNumber,
        averageScore: Math.round((sum / count) * 10) / 10,
        numberOfJudges: count,
        totalScoreSum: sum,
        highestSingleScore: maxSingle,
      }))
      .sort((a, b) => {
        // Primary: average score (desc)
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        // Tiebreak 1: highest single judge score (desc)
        if (b.highestSingleScore !== a.highestSingleScore) return b.highestSingleScore - a.highestSingleScore;
        // Tiebreak 2: more judges scored = more confidence (desc)
        return b.numberOfJudges - a.numberOfJudges;
      });
  }, [scores]);

  const updateConfig = useCallback(async (c: Partial<AppConfig>) => {
    const test3Rounds: Round[] = ['test-primary-3', 'test-final-3'];
    const currentIsTest3 = test3Rounds.includes(config.activeRound);
    const newRound = c.activeRound;
    const switchingAwayFromTest3 = currentIsTest3 && newRound && !test3Rounds.includes(newRound);
    const switchingToTest3 = newRound && test3Rounds.includes(newRound) && !currentIsTest3;
    const switchingToCompetitionDay = c.competitionDayMode === true && !config.competitionDayMode;

    // Clear ALL data when switching away from test-3
    if (switchingAwayFromTest3) {
      await Promise.all([
        supabase.from('scores').delete().in('round', ['test-primary-1', 'test-primary-2', 'test-primary-3', 'test-final-1', 'test-final-2', 'test-final-3']),
        supabase.from('judge_assignments').delete().in('round', ['test-primary-1', 'test-primary-2', 'test-primary-3', 'test-final-1', 'test-final-2', 'test-final-3']),
      ]);
      setScores(prev => prev.filter(s => !s.round.startsWith('test-')));
      setAssignments(prev => prev.filter(a => !(a.round as string).startsWith('test-')));
    }

    // Clear ALL data when entering test-3 or competition day (fresh start)
    if (switchingToTest3 || switchingToCompetitionDay) {
      const allRounds = ['test-primary-1', 'test-primary-2', 'test-primary-3', 'test-final-1', 'test-final-2', 'test-final-3', 'primary', 'final'];
      await Promise.all([
        supabase.from('scores').delete().in('round', allRounds),
        supabase.from('judge_assignments').delete().in('round', allRounds),
      ]);
      setScores([]);
      setAssignments([]);
    }

    const updates: any = {};
    if (c.numberOfTeams !== undefined) updates.number_of_teams = c.numberOfTeams;
    if (c.lockedRounds !== undefined) updates.locked_rounds = c.lockedRounds;
    if (c.competitionDayMode !== undefined) updates.competition_day_mode = c.competitionDayMode;
    if (c.activeRound !== undefined) {
      updates.active_round = c.activeRound;
      setCurrentRoundState(c.activeRound);
    }
    await supabase.from('app_config').update(updates).eq('id', 1);
    setConfig(prev => ({ ...prev, ...c }));
  }, [config.activeRound]);

  const resetRoundScores = useCallback(async (round: Round) => {
    await supabase.from('scores').delete().eq('round', round);
    setScores(prev => prev.filter(s => s.round !== round));
  }, []);

  const registerTeam = useCallback(async (teamData: Omit<Team, 'id' | 'teamNumber' | 'submittedAt' | 'roundGroup'>): Promise<Team> => {
    const roundGroup = getRoundGroup(config.activeRound);
    const { data, error } = await supabase.from('teams').insert({
      team_name: teamData.teamName,
      project_name: teamData.projectName,
      description: teamData.description,
      members: teamData.members,
      round_group: roundGroup,
    } as any).select().single();

    if (error) throw error;
    const team: Team = {
      id: data.id,
      teamNumber: data.team_number,
      teamName: data.team_name,
      projectName: data.project_name,
      description: data.description || '',
      members: data.members || [],
      photoUrl: '',
      submittedAt: data.submitted_at,
      roundGroup: (data as any).round_group || roundGroup,
    };
    setAllTeams(prev => [...prev, team]);


    return team;
  }, [config.activeRound, autoAssignTeamToJudges]);

  const getTeam = useCallback((teamNumber: number) => {
    return allTeams.find(t => t.teamNumber === teamNumber);
  }, [allTeams]);

  const updateTeam = useCallback(async (teamNumber: number, updates: Partial<Team>) => {
    const dbUpdates: any = {};
    if (updates.teamName !== undefined) dbUpdates.team_name = updates.teamName;
    if (updates.projectName !== undefined) dbUpdates.project_name = updates.projectName;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.members !== undefined) dbUpdates.members = updates.members;
    await supabase.from('teams').update(dbUpdates).eq('team_number', teamNumber);
    setAllTeams(prev => prev.map(t => t.teamNumber === teamNumber ? { ...t, ...updates } : t));
  }, []);

  const deleteTeam = useCallback(async (teamNumber: number) => {
    await supabase.from('teams').delete().eq('team_number', teamNumber);
    setAllTeams(prev => prev.filter(t => t.teamNumber !== teamNumber));
  }, []);

  const setTeamSubmissionsLocked = useCallback(async (v: boolean) => {
    await supabase.from('app_config').update({ team_submissions_locked: v }).eq('id', 1);
    setTeamSubmissionsLockedState(v);
  }, []);

  // Derive known judges from scores and assignments for a specific round
  const getKnownJudges = useCallback((round?: Round): Judge[] => {
    const r = round || config.activeRound;
    const judgeMap = new Map<string, string>();
    scores.filter(s => s.round === r).forEach(s => judgeMap.set(s.judgeEmail, s.judgeName));
    assignments.filter(a => a.round === r).forEach(a => judgeMap.set(a.judgeEmail, a.judgeName));
    return Array.from(judgeMap.entries()).map(([email, name]) => ({ email, name }));
  }, [scores, assignments, config.activeRound]);

  // Get ALL judges across all rounds (for lookup/search)
  const getAllHistoricalJudges = useCallback((): Judge[] => {
    const judgeMap = new Map<string, string>();
    scores.forEach(s => judgeMap.set(s.judgeEmail, s.judgeName));
    assignments.forEach(a => judgeMap.set(a.judgeEmail, a.judgeName));
    return Array.from(judgeMap.entries()).map(([email, name]) => ({ email, name }));
  }, [scores, assignments]);

  // Add a judge to a round (creates a placeholder assignment entry + persists to judges registry)
  const addJudgeToRound = useCallback(async (judge: Judge, round: Round) => {
    // Persist to permanent judges registry (ignore conflicts)
    await supabase.from('judges').upsert(
      { name: judge.name, email: judge.email.toLowerCase() },
      { onConflict: 'email' }
    );
    const { data, error } = await supabase.from('judge_assignments').insert({
      judge_name: judge.name,
      judge_email: judge.email.toLowerCase(),
      team_number: allTeams[0]?.teamNumber || 1,
      round,
    }).select().single();
    if (error) throw error;
    setAssignments(prev => [...prev, {
      id: data.id, judgeEmail: data.judge_email, judgeName: data.judge_name,
      teamNumber: data.team_number, round: data.round as Round,
    }]);
  }, [allTeams]);

  // Remove a judge from a round
  const removeJudgeFromRound = useCallback(async (email: string, round: Round) => {
    await supabase.from('judge_assignments').delete().eq('judge_email', email).eq('round', round);
    await supabase.from('scores').delete().eq('judge_email', email).eq('round', round);
    setAssignments(prev => prev.filter(a => !(a.judgeEmail === email && a.round === round)));
    setScores(prev => prev.filter(s => !(s.judgeEmail === email && s.round === round)));
  }, []);


  const getTeamJudges = useCallback((teamNumber: number, round: Round): string[] => {
    return assignments
      .filter(a => a.teamNumber === teamNumber && a.round === round)
      .map(a => a.judgeName);
  }, [assignments]);

  const reassignJudge = useCallback(async (judgeEmail: string, round: Round, fromTeamNumber: number, toTeamNumber: number) => {
    // Delete old assignment
    await supabase.from('judge_assignments').delete()
      .eq('judge_email', judgeEmail).eq('round', round).eq('team_number', fromTeamNumber);
    // Insert new assignment
    const existing = assignments.find(a => a.judgeEmail === judgeEmail && a.round === round && a.teamNumber === fromTeamNumber);
    const judgeName = existing?.judgeName || judgeEmail;
    const { error } = await supabase.from('judge_assignments').insert({
      judge_email: judgeEmail, judge_name: judgeName, team_number: toTeamNumber, round,
    });
    if (error) throw error;
    setAssignments(prev => prev.map(a =>
      a.judgeEmail === judgeEmail && a.round === round && a.teamNumber === fromTeamNumber
        ? { ...a, teamNumber: toTeamNumber }
        : a
    ));
  }, [assignments]);

  const unassignJudgeFromTeam = useCallback(async (judgeEmail: string, round: Round, teamNumber: number) => {
    await supabase.from('judge_assignments').delete()
      .eq('judge_email', judgeEmail).eq('round', round).eq('team_number', teamNumber);
    setAssignments(prev => prev.filter(a =>
      !(a.judgeEmail === judgeEmail && a.round === round && a.teamNumber === teamNumber)
    ));
  }, []);

  const generateAssignments = useCallback(async (round: Round, judges: Judge[]) => {
    // Filter teams for the round's group
    const roundGroup = getRoundGroup(round);
    const roundTeams = allTeams.filter(t => t.roundGroup === roundGroup);
    if (judges.length < 2 || roundTeams.length === 0) {
      throw new Error('Need at least 2 judges.');
    }

    const isFinalRound = FINAL_ROUNDS.includes(round);
    const newAssignments: { judge_email: string; judge_name: string; team_number: number; round: string }[] = [];

    if (isFinalRound) {
      const sourceRound = ADVANCEMENT_MAP[round];
      if (!sourceRound) throw new Error('No source primary round found.');
      const leaderboard = getLeaderboard(sourceRound);
      const finalistNumbers = leaderboard.slice(0, FINALISTS_COUNT).map(r => r.teamNumber);
      if (finalistNumbers.length === 0) throw new Error('No scores in the primary round yet. Score the primary round first.');
      finalistNumbers.forEach(teamNum => {
        judges.forEach(judge => {
          newAssignments.push({ judge_email: judge.email, judge_name: judge.name, team_number: teamNum, round });
        });
      });
    } else {
      const teamNumbers = roundTeams.map(t => t.teamNumber);
      const shuffledJudges = [...judges].sort(() => Math.random() - 0.5);
      const pairs: [Judge, Judge][] = [];
      for (let i = 0; i + 1 < shuffledJudges.length; i += 2) {
        pairs.push([shuffledJudges[i], shuffledJudges[i + 1]]);
      }
      if (shuffledJudges.length % 2 !== 0) {
        pairs.push([shuffledJudges[shuffledJudges.length - 1], shuffledJudges[0]]);
      }
      const shuffledTeams = [...teamNumbers].sort(() => Math.random() - 0.5);
      shuffledTeams.forEach((teamNum, i) => {
        const pair = pairs[i % pairs.length];
        pair.forEach(judge => {
          newAssignments.push({ judge_email: judge.email, judge_name: judge.name, team_number: teamNum, round });
        });
      });
    }

    await supabase.from('judge_assignments').delete().eq('round', round);
    const { error } = await supabase.from('judge_assignments').insert(newAssignments);
    if (error) throw error;
    setAssignments(prev => [
      ...prev.filter(a => a.round !== round),
      ...newAssignments.map(a => ({ id: '', judgeEmail: a.judge_email, judgeName: a.judge_name, teamNumber: a.team_number, round: round as Round })),
    ]);
  }, [allTeams, getLeaderboard]);

  const clearAssignments = useCallback(async (round: Round) => {
    await supabase.from('judge_assignments').delete().eq('round', round);
    setAssignments(prev => prev.filter(a => a.round !== round));
  }, []);

  const getAssignedTeams = useCallback((round: Round) => {
    if (!judge) return [];
    return assignments.filter(a => a.judgeEmail === judge.email && a.round === round).map(a => a.teamNumber);
  }, [assignments, judge]);

  const getJudgePartner = useCallback((round: Round): string | null => {
    if (!judge) return null;
    // Find teams assigned to this judge for this round
    const myTeams = assignments.filter(a => a.judgeEmail === judge.email && a.round === round).map(a => a.teamNumber);
    if (myTeams.length === 0) return null;
    // Find other judges assigned to the same teams
    const partners = new Set<string>();
    myTeams.forEach(teamNum => {
      assignments.filter(a => a.teamNumber === teamNum && a.round === round && a.judgeEmail !== judge.email)
        .forEach(a => partners.add(a.judgeName));
    });
    return partners.size > 0 ? Array.from(partners).join(', ') : null;
  }, [assignments, judge]);

  // Derive teams filtered by current round group
  const currentRoundGroup = getRoundGroup(config.activeRound);
  const teams = React.useMemo(() => 
    allTeams.filter(t => t.roundGroup === currentRoundGroup),
    [allTeams, currentRoundGroup]
  );

  // Display renumbering: competition day mode or test rounds → sequential 1,2,3...
  const shouldRenumber = config.competitionDayMode || config.activeRound.startsWith('test-');
  const displayNumberMap = React.useMemo(() => {
    if (!shouldRenumber) return null;
    const sorted = [...teams].sort((a, b) => a.teamNumber - b.teamNumber);
    const map = new Map<number, number>();
    sorted.forEach((t, i) => map.set(t.teamNumber, i + 1));
    return map;
  }, [teams, shouldRenumber]);

  const getDisplayTeamNumber = useCallback((teamNumber: number): number => {
    if (!shouldRenumber || !displayNumberMap) return teamNumber;
    return displayNumberMap.get(teamNumber) ?? teamNumber;
  }, [shouldRenumber, displayNumberMap]);


  return (
    <JudgingContext.Provider value={{
      judge, setJudge, currentRound, setCurrentRound,
      scores, saveScore, getScoreForTeam, getScoredTeams,
      getLeaderboard, config, updateConfig, getAllScores: () => scores,
      resetRoundScores, isAdmin, setIsAdmin,
      teams, allTeams, registerTeam, getTeam, updateTeam, deleteTeam,
      teamSubmissionsLocked, setTeamSubmissionsLocked, loading,
      assignments, generateAssignments, clearAssignments, getAssignedTeams, getJudgePartner,
      getKnownJudges, getAllHistoricalJudges, addJudgeToRound, removeJudgeFromRound, getTeamJudges, getDisplayTeamNumber, shouldRenumber, reassignJudge, unassignJudgeFromTeam,
    }}>
      {children}
    </JudgingContext.Provider>
  );
}

export function useJudging() {
  const ctx = useContext(JudgingContext);
  if (!ctx) throw new Error('useJudging must be used within JudgingProvider');
  return ctx;
}
