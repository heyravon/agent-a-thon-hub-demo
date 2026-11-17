import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useJudging, JudgeAssignment } from '@/context/JudgingContext';
import { ROUNDS, ROUND_LABELS, JUDGING_CATEGORIES, Round, FINALISTS_COUNT, ADVANCEMENT_MAP, PRIMARY_ROUNDS, FINAL_ROUNDS, TEST_ROUNDS, OFFICIAL_ROUNDS } from '@/types/judging';
import { Judge } from '@/types/judging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Pencil, Trash2, Lock, Unlock, Users, ChevronDown, ChevronUp, Eye, Radio, Trophy, Shuffle, Plus, BarChart3, Download, Gavel, Activity } from 'lucide-react';

export function AdminPanel() {
  const { config, updateConfig, getAllScores, resetRoundScores, teams, registerTeam, updateTeam, deleteTeam, teamSubmissionsLocked, setTeamSubmissionsLocked, getLeaderboard, assignments, generateAssignments, clearAssignments, getKnownJudges, addJudgeToRound, removeJudgeFromRound, getTeamJudges, getDisplayTeamNumber, shouldRenumber, reassignJudge, unassignJudgeFromTeam } = useJudging();
  const [teamCount, setTeamCount] = useState(String(config.numberOfTeams));
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMembers, setEditMembers] = useState('');
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const [expandedTeamDetail, setExpandedTeamDetail] = useState<number | null>(null);
  const [assignRound, setAssignRound] = useState<'primary' | 'final'>('primary');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [judgeSearch, setJudgeSearch] = useState('');
  const [historicalJudges, setHistoricalJudges] = useState<{ name: string; email: string }[]>([]);
  const [showJudgeLookup, setShowJudgeLookup] = useState(false);
  const [reassigning, setReassigning] = useState<{ judges: { email: string; name: string }[]; fromTeam: number; mode: 'choose' | 'pair' | 'individual'; selectedJudge?: { email: string; name: string } } | null>(null);
  const allScores = getAllScores();

  // Fetch all historical judges from DB on mount
  useEffect(() => {
    const fetchHistorical = async () => {
      const { data } = await supabase.from('judges').select('name, email').order('name');
      if (data) setHistoricalJudges(data.map(j => ({ name: j.name, email: j.email })));
    };
    fetchHistorical();
  }, []);

  const visibleRounds = config.competitionDayMode ? OFFICIAL_ROUNDS : TEST_ROUNDS;
  const filteredScores = allScores.filter(s => visibleRounds.includes(s.round));

  // Map assignRound type to the actual round based on active round
  const getActualRound = (type: 'primary' | 'final'): Round => {
    if (config.competitionDayMode) return type;
    // Extract the test number from active round (e.g. test-primary-3 -> 3)
    const match = config.activeRound.match(/test-(?:primary|final)-(\d)/);
    const num = match ? match[1] : '1';
    return `test-${type}-${num}` as Round;
  };
  const actualAssignRound = getActualRound(assignRound);
  const knownJudges = getKnownJudges(actualAssignRound);

  // Event monitoring stats
  const activeRoundScores = allScores.filter(s => s.round === config.activeRound);
  const scoredTeamNumbers = new Set(activeRoundScores.map(s => s.teamNumber));
  const leaderboard = getLeaderboard(config.activeRound);
  const leader = leaderboard[0];

  const handleTeamCountSave = () => {
    const n = parseInt(teamCount);
    if (n >= 1 && n <= 200) {
      updateConfig({ numberOfTeams: n });
      toast.success(`Team count set to ${n}`);
    }
  };

  const handleReset = async (round: Round) => {
    if (confirm(`Reset all scores for ${ROUND_LABELS[round]}? This cannot be undone.`)) {
      await resetRoundScores(round);
      toast.success(`Scores for ${ROUND_LABELS[round]} reset.`);
    }
  };

  const toggleLock = (round: Round) => {
    const locked = config.lockedRounds.includes(round);
    updateConfig({
      lockedRounds: locked
        ? config.lockedRounds.filter(r => r !== round)
        : [...config.lockedRounds, round],
    });
    toast.success(`${ROUND_LABELS[round]} ${locked ? 'unlocked' : 'locked'}.`);
  };

  const setActiveRound = (round: Round) => {
    updateConfig({ activeRound: round });
    toast.success(`Active round set to ${ROUND_LABELS[round]}`);
  };

  const exportCSV = (round?: Round) => {
    const data = round ? allScores.filter(s => s.round === round) : filteredScores;
    if (data.length === 0) { toast.error('No scores to export.'); return; }
    const catHeaders = JUDGING_CATEGORIES.map(c => c.name);
    const header = ['Judge', 'Email', 'Team', 'Round', ...catHeaders, 'Total', 'Timestamp'];
    const rows = data.map(s => [
      s.judgeName, s.judgeEmail, `Team ${getDisplayTeamNumber(s.teamNumber)}`, ROUND_LABELS[s.round],
      ...JUDGING_CATEGORIES.map(c => {
        const cs = s.categoryScores.find(sc => sc.categoryId === c.id);
        return cs ? String(cs.score) : '0';
      }),
      String(s.totalScore), s.timestamp,
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scores${round ? `-${round}` : '-all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTeams = () => {
    if (teams.length === 0) { toast.error('No teams to export.'); return; }
    const header = ['Team Number', 'Team Name', 'Project Name', 'Description', 'Members', 'Submitted At'];
    const rows = teams.map(t => [
      String(getDisplayTeamNumber(t.teamNumber)), t.teamName, t.projectName, t.description, t.members.join('; '), t.submittedAt,
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teams.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEditTeam = (teamNumber: number) => {
    const team = teams.find(t => t.teamNumber === teamNumber);
    if (!team) return;
    setEditingTeam(teamNumber);
    setEditName(team.teamName);
    setEditDescription(team.description);
    setEditMembers(team.members.join(', '));
  };

  const saveTeamEdit = async () => {
    if (editingTeam !== null && editName.trim()) {
      await updateTeam(editingTeam, {
        teamName: editName.trim(),
        description: editDescription.trim(),
        members: editMembers.split(',').map(m => m.trim()).filter(Boolean),
      });
      toast.success(`Team ${getDisplayTeamNumber(editingTeam)} updated.`);
      setEditingTeam(null);
    }
  };

  const handleDeleteTeam = async (teamNumber: number) => {
    if (confirm(`Delete Team ${getDisplayTeamNumber(teamNumber)}? This cannot be undone.`)) {
      await deleteTeam(teamNumber);
      toast.success(`Team ${getDisplayTeamNumber(teamNumber)} deleted.`);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !newProjectName.trim()) {
      toast.error('Team name and project name are required.');
      return;
    }
    try {
      const team = await registerTeam({
        teamName: newTeamName.trim(),
        projectName: newProjectName.trim(),
        description: newDescription.trim(),
        members: newMembers.split(',').map(m => m.trim()).filter(Boolean),
        photoUrl: '',
      });
      toast.success(`Team ${getDisplayTeamNumber(team.teamNumber)} added.`);
      setShowAddTeam(false);
      setNewTeamName('');
      setNewProjectName('');
      setNewDescription('');
      setNewMembers('');
    } catch { toast.error('Failed to add team.'); }
  };

  const getTeamScores = (teamNumber: number) => allScores.filter(s => s.teamNumber === teamNumber);
  const getTeamName = (num: number) => {
    const t = teams.find(t => t.teamNumber === num);
    return t ? t.teamName : `Team ${getDisplayTeamNumber(num)}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Admin Dashboard</h2>

      {/* Event Monitoring Dashboard */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Event Monitor
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-foreground">{teams.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Teams Registered</div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-foreground">{historicalJudges.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Judges Registered</div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-foreground">{filteredScores.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Scores Submitted</div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-foreground">{scoredTeamNumbers.size}/{teams.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Teams Scored</div>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-center sm:col-span-3 lg:col-span-1">
            <div className="text-sm font-bold text-primary truncate">
              {leader ? `Team ${getDisplayTeamNumber(leader.teamNumber)}` : '—'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {leader ? `${leader.averageScore} avg` : 'Current Leader'}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Radio className="h-3 w-3 text-primary" />
          <span>Current Round: <span className="font-semibold text-foreground">{ROUND_LABELS[config.activeRound]}</span></span>
        </div>
      </div>

      {/* Competition Day Mode Toggle */}
      {/* Test Competition Day Mode */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              🧪 Test Competition Day
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Practice mode — behaves exactly like competition day but uses test rounds. All data is cleared on exit.
            </p>
          </div>
          <Button
            variant={shouldRenumber && !config.competitionDayMode ? 'default' : 'outline'}
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => {
              const isCurrentlyTestComp = (config.activeRound === 'test-primary-3' || config.activeRound === 'test-final-3') && !config.competitionDayMode;
              if (isCurrentlyTestComp) {
                // Turn off — go back to test-primary-1
                updateConfig({ activeRound: 'test-primary-1' as Round });
                toast.success('Test Competition Day OFF — back to normal test rounds');
              } else {
                // Turn on — switch to test-primary-3
                updateConfig({ competitionDayMode: false, activeRound: 'test-primary-3' as Round });
                toast.success('Test Competition Day ON — practice mode active, all data cleared');
              }
            }}
          >
            {shouldRenumber && !config.competitionDayMode ? '🟢 ON' : '⚪ OFF'}
          </Button>
        </div>
      </div>

      {/* Real Competition Day Mode */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              🏁 Competition Day Mode
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {config.competitionDayMode
                ? 'Official rounds (Primary & Final) are active. All data cleared for fresh start.'
                : 'Enable on the actual competition day. Uses official Primary & Final rounds.'}
            </p>
          </div>
          <Button
            variant={config.competitionDayMode ? 'default' : 'outline'}
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => {
              const newMode = !config.competitionDayMode;
              const newActiveRound = newMode ? 'primary' : 'test-primary-1';
              updateConfig({ competitionDayMode: newMode, activeRound: newActiveRound as Round });
              toast.success(newMode ? 'Competition Day Mode ON — Official rounds active' : 'Competition Day Mode OFF — Test rounds active');
            }}
          >
            {config.competitionDayMode ? '🟢 ON' : '⚪ OFF'}
          </Button>
        </div>
      </div>

      {/* Active Round Control */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          Active Round
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          This controls which round all judges are scoring in. Changing this updates everyone in real-time.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(config.competitionDayMode
            ? [['primary', 'final'] as Round[]]
            : [
                ['test-primary-1', 'test-final-1'] as Round[],
                ['test-primary-2', 'test-final-2'] as Round[],
                ['test-primary-3', 'test-final-3'] as Round[],
              ]
          ).flatMap(pair => pair).map(r => (
            <button
              key={r}
              onClick={() => setActiveRound(r)}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                config.activeRound === r
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {ROUND_LABELS[r]}
              {config.activeRound === r && <span className="ml-2 text-xs">● LIVE</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Judge Assignment */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <Shuffle className="h-4 w-4 text-primary" />
          Judge-Team Assignments
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Assignments are <strong>auto-generated</strong> when you switch the active round (if ≥2 judges exist). You can override by re-generating below.
        </p>

        {/* Round type selector dropdown */}
        <div className="mb-3">
          <label className="text-[11px] text-muted-foreground mb-1 block">Round Type</label>
          <select
            value={assignRound}
            onChange={e => setAssignRound(e.target.value as 'primary' | 'final')}
            className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground w-48"
          >
            <option value="primary">Primary</option>
            <option value="final">Final</option>
          </select>
        </div>

        {/* Add Judge */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-foreground">Add Judge</p>
            <button
              onClick={() => setShowJudgeLookup(!showJudgeLookup)}
              className="text-[11px] text-primary hover:underline"
            >
              {showJudgeLookup ? 'Manual entry' : 'Look up existing'}
            </button>
          </div>

          {showJudgeLookup ? (
            <div>
              <Input
                value={judgeSearch}
                onChange={e => setJudgeSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="h-8 text-xs mb-2"
              />
              {(() => {
                const search = judgeSearch.toLowerCase().trim();
                const currentEmails = new Set(knownJudges.map(j => j.email));
                const filtered = search.length >= 2
                  ? historicalJudges.filter(j =>
                      !currentEmails.has(j.email) &&
                      (j.name.toLowerCase().includes(search) || j.email.toLowerCase().includes(search))
                    )
                  : [];
                if (search.length < 2) return <p className="text-[11px] text-muted-foreground">Type at least 2 characters to search...</p>;
                if (filtered.length === 0) return <p className="text-[11px] text-muted-foreground">No matching judges found.</p>;
                return (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {filtered.slice(0, 10).map(j => (
                      <div key={j.email} className="rounded-lg bg-secondary/30 px-3 py-1.5 text-xs flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-foreground">{j.name}</span>
                        <span className="text-muted-foreground flex-1">{j.email}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] px-2 gap-1"
                          onClick={async () => {
                            try {
                              await addJudgeToRound({ name: j.name, email: j.email }, actualAssignRound);
                              toast.success(`Added ${j.name}`);
                              setJudgeSearch('');
                            } catch { toast.error('Failed to add judge.'); }
                          }}
                        >
                          <Plus className="h-3 w-3" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[11px] text-muted-foreground mb-1 block">Name</label>
                <Input
                  value={newJudgeName}
                  onChange={e => setNewJudgeName(e.target.value)}
                  placeholder="Judge name"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-muted-foreground mb-1 block">Email</label>
                <Input
                  value={newJudgeEmail}
                  onChange={e => setNewJudgeEmail(e.target.value)}
                  placeholder="judge@email.com"
                  className="h-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={async () => {
                  if (!newJudgeName.trim() || !newJudgeEmail.trim()) { toast.error('Name and email required.'); return; }
                  try {
                    await addJudgeToRound({ name: newJudgeName.trim(), email: newJudgeEmail.trim().toLowerCase() }, actualAssignRound);
                    toast.success(`Added judge ${newJudgeName.trim()}`);
                    setNewJudgeName('');
                    setNewJudgeEmail('');
                  } catch { toast.error('Failed to add judge.'); }
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          )}
        </div>

        {/* Judges assigned to this round */}
        <div className="mb-3">
          <p className="text-xs font-medium text-foreground mb-2">Judges in {ROUND_LABELS[actualAssignRound]} ({knownJudges.length}):</p>
          {knownJudges.length === 0 ? (
            <p className="text-xs text-muted-foreground">No judges assigned to this round yet.</p>
          ) : (
            <div className="space-y-1">
              {knownJudges.map(j => (
                <div key={j.email} className="rounded-lg bg-secondary/30 px-3 py-1.5 text-xs flex items-center gap-2">
                  <Users className="h-3 w-3 text-primary" />
                  <span className="font-medium text-foreground">{j.name}</span>
                  <span className="text-muted-foreground flex-1">{j.email}</span>
                  <button
                    onClick={async () => {
                      if (confirm(`Remove ${j.name} from this round?`)) {
                        await removeJudgeFromRound(j.email, actualAssignRound);
                        toast.success(`Removed ${j.name}`);
                      }
                    }}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All registered judges */}
        <div className="mb-3">
          <p className="text-xs font-medium text-foreground mb-2">All Registered Judges ({historicalJudges.length}):</p>
          {historicalJudges.length === 0 ? (
            <p className="text-xs text-muted-foreground">No judges have registered yet.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {historicalJudges.map(j => {
                const isInRound = knownJudges.some(k => k.email === j.email);
                return (
                  <div key={j.email} className="rounded-lg bg-secondary/20 px-3 py-1.5 text-xs flex items-center gap-2">
                    <Gavel className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{j.name}</span>
                    <span className="text-muted-foreground flex-1">{j.email}</span>
                    {isInRound ? (
                      <span className="text-[10px] text-primary font-medium">In round</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] px-2 gap-1"
                        onClick={async () => {
                          try {
                            await addJudgeToRound({ name: j.name, email: j.email }, actualAssignRound);
                            toast.success(`Added ${j.name} to ${ROUND_LABELS[actualAssignRound]}`);
                          } catch { toast.error('Failed to add judge.'); }
                        }}
                      >
                        <Plus className="h-3 w-3" /> Add to round
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={async () => {
              if (knownJudges.length < 2) { toast.error('Need at least 2 judges to assign (every team gets 2).'); return; }
              try {
                await generateAssignments(actualAssignRound, knownJudges);
                toast.success(`Assigned ${teams.length} teams to ${knownJudges.length} judges for ${ROUND_LABELS[actualAssignRound]}`);
              } catch { toast.error('Failed to generate assignments.'); }
            }}
          >
            <Shuffle className="h-3.5 w-3.5" /> Generate Random Assignments
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={async () => {
              if (confirm(`Clear all assignments for ${ROUND_LABELS[actualAssignRound]}?`)) {
                await clearAssignments(actualAssignRound);
                toast.success('Assignments cleared.');
              }
            }}
          >
            Clear
          </Button>
        </div>

        {/* Show current assignments grouped by judge pairs */}
        {(() => {
          const roundAssignments = assignments.filter(a => a.round === actualAssignRound);
          if (roundAssignments.length === 0) return null;

          const byTeam = new Map<number, JudgeAssignment[]>();
          roundAssignments.forEach(a => {
            byTeam.set(a.teamNumber, [...(byTeam.get(a.teamNumber) || []), a]);
          });

          const pairGroups = new Map<string, { judges: string[]; teams: number[] }>();
          byTeam.forEach((assigns, teamNum) => {
            const key = assigns.map(a => a.judgeEmail).sort().join('|');
            const existing = pairGroups.get(key) || { judges: assigns.map(a => `${a.judgeName} (${a.judgeEmail})`), teams: [] };
            existing.teams.push(teamNum);
            pairGroups.set(key, existing);
          });

          // All team numbers for reassign dropdown
          const allTeamNumbers = teams.map(t => t.teamNumber).sort((a, b) => a - b);

          return (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-foreground">Judge Pairs for {ROUND_LABELS[actualAssignRound]}:</p>
              {Array.from(pairGroups.values()).map((group, i) => (
                <div key={i} className="rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                  <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {group.judges.join(' & ')}
                    <span className="text-muted-foreground font-normal ml-1">— {group.teams.length} teams</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.teams.sort((a, b) => a - b).map(teamNum => {
                      const teamAssigns = byTeam.get(teamNum) || [];
                      return (
                        <div key={teamNum} className="inline-flex items-center gap-1 rounded-md bg-background/60 border border-border px-2 py-0.5">
                          <span className="text-muted-foreground">Team {getDisplayTeamNumber(teamNum)}</span>
                          <button
                            onClick={() => {
                              setReassigning({
                                judges: teamAssigns.map(a => ({ email: a.judgeEmail, name: a.judgeName })),
                                fromTeam: teamNum,
                                mode: teamAssigns.length > 1 ? 'choose' : 'individual',
                                selectedJudge: teamAssigns.length === 1 ? { email: teamAssigns[0].judgeEmail, name: teamAssigns[0].judgeName } : undefined,
                              });
                            }}
                            className="text-primary hover:text-primary/80 ml-0.5"
                            title="Reassign or remove"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                          <button
                            onClick={async () => {
                              const teamAssignsForTeam = byTeam.get(teamNum) || [];
                              if (!confirm(`Remove all judge assignments for Team ${getDisplayTeamNumber(teamNum)}?`)) return;
                              try {
                                for (const a of teamAssignsForTeam) {
                                  await unassignJudgeFromTeam(a.judgeEmail, actualAssignRound, teamNum);
                                }
                                toast.success(`Removed all assignments for Team ${getDisplayTeamNumber(teamNum)}`);
                              } catch { toast.error('Failed to remove.'); }
                            }}
                            className="text-destructive hover:text-destructive/80"
                            title="Remove assignment"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Reassign panel */}
              {reassigning && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
                  <p className="text-xs font-semibold text-foreground">
                    Team {getDisplayTeamNumber(reassigning.fromTeam)} — {reassigning.mode === 'choose' ? 'Who to reassign?' : `Reassign ${reassigning.selectedJudge?.name || ''}`}
                  </p>

                  {/* Step 1: Choose pair or individual (if multiple judges) */}
                  {reassigning.mode === 'choose' && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-muted-foreground">Reassign the entire pair or just one judge?</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setReassigning({ ...reassigning, mode: 'pair' })}>
                          <Users className="h-3 w-3" /> Entire Pair
                        </Button>
                        {reassigning.judges.map(j => (
                          <Button key={j.email} size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReassigning({ ...reassigning, mode: 'individual', selectedJudge: j })}>
                            {j.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Pick target team or remove */}
                  {(reassigning.mode === 'pair' || reassigning.mode === 'individual') && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-muted-foreground">
                        {reassigning.mode === 'pair'
                          ? `Move all ${reassigning.judges.length} judges to another team, or remove them.`
                          : `Move ${reassigning.selectedJudge?.name} to another team, or remove them.`}
                      </p>
                      <select
                        className="h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground w-full"
                        defaultValue=""
                        onChange={async (e) => {
                          const toTeam = Number(e.target.value);
                          if (!toTeam) return;
                          try {
                            const judgesToMove = reassigning.mode === 'pair' ? reassigning.judges : [reassigning.selectedJudge!];
                            for (const j of judgesToMove) {
                              await reassignJudge(j.email, actualAssignRound, reassigning.fromTeam, toTeam);
                            }
                            toast.success(`Reassigned to Team ${getDisplayTeamNumber(toTeam)}`);
                            setReassigning(null);
                          } catch { toast.error('Failed to reassign.'); }
                        }}
                      >
                        <option value="" disabled>Select a team...</option>
                        {allTeamNumbers.filter(n => n !== reassigning.fromTeam).map(n => (
                          <option key={n} value={n}>Team {getDisplayTeamNumber(n)} — {teams.find(t => t.teamNumber === n)?.teamName || ''}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={async () => {
                            const judgesToRemove = reassigning.mode === 'pair' ? reassigning.judges : [reassigning.selectedJudge!];
                            const label = reassigning.mode === 'pair' ? 'entire pair' : reassigning.selectedJudge?.name;
                            if (!confirm(`Remove ${label} from Team ${getDisplayTeamNumber(reassigning.fromTeam)}?`)) return;
                            try {
                              for (const j of judgesToRemove) {
                                await unassignJudgeFromTeam(j.email, actualAssignRound, reassigning.fromTeam);
                              }
                              toast.success(`Removed ${label}`);
                              setReassigning(null);
                            } catch { toast.error('Failed to remove.'); }
                          }}
                        >
                          <Trash2 className="h-3 w-3" /> Remove Instead
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReassigning(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Top 8 Advancement */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold" />
          Top {FINALISTS_COUNT} Advancement
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Top {FINALISTS_COUNT} teams from each primary round advance to the corresponding final round.
        </p>
        <div className="space-y-4">
          {Object.entries(ADVANCEMENT_MAP).map(([finalRound, primaryRound]) => {
            if (!visibleRounds.includes(primaryRound as Round) && !visibleRounds.includes(finalRound as Round)) return null;
            const rankings = getLeaderboard(primaryRound as Round);
            const top = rankings.slice(0, FINALISTS_COUNT);
            return (
              <div key={finalRound}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-foreground">{ROUND_LABELS[primaryRound as Round]}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs font-semibold text-primary">{ROUND_LABELS[finalRound as Round]}</span>
                </div>
                {top.length === 0 ? (
                  <p className="text-xs text-muted-foreground ml-2">No scores yet.</p>
                ) : (
                  <div className="space-y-1">
                    {top.map((team, i) => (
                      <div key={team.teamNumber} className="rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold tabular-nums text-primary w-5">#{i + 1}</span>
                            <span className="font-semibold text-foreground">Team {getDisplayTeamNumber(team.teamNumber)}: {getTeamName(team.teamNumber)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="tabular-nums text-muted-foreground">{team.numberOfJudges} judges</span>
                            <span className="font-bold tabular-nums text-foreground">{team.averageScore} avg</span>
                          </div>
                        </div>
                        {(() => {
                          const judges = getTeamJudges(team.teamNumber, primaryRound as Round);
                          return judges.length > 0 ? (
                            <div className="mt-1 ml-7 text-muted-foreground">👨‍⚖️ {judges.join(' & ')}</div>
                          ) : null;
                        })()}
                      </div>
                    ))}
                  </div>
                )}
                {rankings.length > FINALISTS_COUNT && (
                  <p className="mt-1 ml-2 text-xs text-muted-foreground">
                    {rankings.length - FINALISTS_COUNT} teams did not advance.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Registered Teams for current round group */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Registered Teams ({teams.length})
          </h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => setShowAddTeam(!showAddTeam)}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Team
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={exportTeams}
            >
              <Download className="h-3 w-3 mr-1" /> Export Teams
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={async () => { await setTeamSubmissionsLocked(!teamSubmissionsLocked); toast.success(teamSubmissionsLocked ? 'Submissions unlocked.' : 'Submissions locked.'); }}
            >
              {teamSubmissionsLocked ? <><Unlock className="h-3 w-3 mr-1" /> Unlock</> : <><Lock className="h-3 w-3 mr-1" /> Lock</>}
            </Button>
          </div>
        </div>

        {/* Add Team Form */}
        {showAddTeam && (
          <div className="mb-4 rounded-lg bg-secondary/30 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-foreground">Add Team Manually</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Team name *" className="h-9 text-xs" />
              <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="Project name *" className="h-9 text-xs" />
            </div>
            <Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Description" className="h-9 text-xs" />
            <Input value={newMembers} onChange={e => setNewMembers(e.target.value)} placeholder="Members (comma-separated)" className="h-9 text-xs" />
            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-xs" onClick={handleAddTeam}>Add Team</Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowAddTeam(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {teamSubmissionsLocked && (
          <div className="mb-3 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
            🔒 Team submissions are locked. No new teams can register.
          </div>
        )}
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams registered yet. Share the registration link: <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">/register</code></p>
        ) : (
          <div className="space-y-1">
            {teams.sort((a, b) => a.teamNumber - b.teamNumber).map(t => {
              const teamScores = getTeamScores(t.teamNumber);
              const isExpanded = expandedTeamDetail === t.teamNumber;
              const isEditing = editingTeam === t.teamNumber;
              return (
                <div key={t.id} className="rounded-lg bg-secondary/30 overflow-hidden">
                  <div className="px-3 py-2 text-xs">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Team name" className="h-7 text-xs" />
                          <Input value={editMembers} onChange={e => setEditMembers(e.target.value)} placeholder="Members (comma-separated)" className="h-7 text-xs" />
                        </div>
                        <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" className="h-7 text-xs" />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={saveTeamEdit}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingTeam(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div>
                            <span className="font-semibold text-foreground">Team {getDisplayTeamNumber(t.teamNumber)}: {t.teamName}</span>
                            <span className="ml-2 text-muted-foreground">{t.projectName}</span>
                            <span className="ml-2 text-muted-foreground">· {t.members.length} members</span>
                            {teamScores.length > 0 && (
                              <span className="ml-2 text-primary font-medium">· {teamScores.length} votes</span>
                            )}
                            {(() => {
                              const judges = getTeamJudges(t.teamNumber, config.activeRound);
                              return judges.length > 0 ? (
                                <span className="ml-2 text-muted-foreground">· 👨‍⚖️ {judges.join(' & ')}</span>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          {teamScores.length > 0 && (
                            <button onClick={() => setExpandedTeamDetail(isExpanded ? null : t.teamNumber)} className="rounded p-1 text-muted-foreground hover:bg-secondary" title="View details">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => startEditTeam(t.teamNumber)} className="rounded p-1 text-muted-foreground hover:bg-secondary" title="Edit team">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTeam(t.teamNumber)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete team">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {isExpanded && !isEditing && (
                    <div className="border-t border-border px-3 py-3 space-y-3">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Members:</span> {t.members.join(', ')}
                      </div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Description:</span> {t.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Submitted:</span> {new Date(t.submittedAt).toLocaleString()}
                      </div>
                      <div className="text-xs font-medium text-foreground mb-1">Judge Votes:</div>
                      {teamScores.map(s => (
                        <div key={s.id} className="rounded-lg bg-background border border-border p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-foreground">{s.judgeName}</span>
                              <span className="ml-2 text-muted-foreground">{s.judgeEmail}</span>
                              <span className="ml-2 text-muted-foreground">{ROUND_LABELS[s.round]}</span>
                            </div>
                            <span className="font-bold tabular-nums text-foreground">{s.totalScore}/100</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {JUDGING_CATEGORIES.map(cat => {
                              const cs = s.categoryScores.find(c => c.categoryId === cat.id);
                              return (
                                <div key={cat.id} className="flex justify-between">
                                  <span className="text-muted-foreground">{cat.name}</span>
                                  <span className="tabular-nums font-medium text-foreground">{cs?.score ?? 0}/{cat.maxScore}</span>
                                </div>
                              );
                            })}
                          </div>
                          {s.categoryScores.some(c => c.comment) && (
                            <div className="space-y-1 pt-1 border-t border-border">
                              {s.categoryScores.filter(c => c.comment).map(c => {
                                const cat = JUDGING_CATEGORIES.find(j => j.id === c.categoryId);
                                return (
                                  <div key={c.categoryId} className="text-muted-foreground">
                                    <span className="font-medium text-foreground">{cat?.name}:</span> "{c.comment}"
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Config */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Team Configuration</h3>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            max={200}
            value={teamCount}
            onChange={e => setTeamCount(e.target.value)}
            className="h-11 w-24"
          />
          <span className="text-sm text-muted-foreground">teams</span>
          <Button onClick={handleTeamCountSave} size="sm" className="h-9 rounded-lg">Save</Button>
        </div>
      </div>

      {/* Round Management */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Round Management</h3>
        <div className="space-y-3">
          {visibleRounds.map(r => {
            const count = filteredScores.filter(s => s.round === r).length;
            const locked = config.lockedRounds.includes(r);
            const isActive = config.activeRound === r;
            return (
              <div key={r} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 ${isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-secondary/50'}`}>
                <div>
                  <span className="text-sm font-medium text-foreground">{ROUND_LABELS[r]}</span>
                  {isActive && <span className="ml-2 text-xs font-medium text-primary">● LIVE</span>}
                  <span className="ml-2 text-xs tabular-nums text-muted-foreground">{count} scores</span>
                  {locked && <span className="ml-2 text-xs font-medium text-warning">🔒 Locked</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => toggleLock(r)}>
                    {locked ? 'Unlock' : 'Lock'}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => handleReset(r)}>
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => exportCSV(r)}>
                    Export
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Scores with expandable details */}
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">All Scores ({filteredScores.length})</h3>
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => exportCSV()}>Export All</Button>
        </div>
        {filteredScores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scores submitted yet.</p>
        ) : (
          <div className="max-h-[600px] space-y-1 overflow-y-auto">
            {filteredScores.slice().reverse().map(s => (
              <div key={s.id} className="rounded-lg bg-secondary/30 overflow-hidden">
                <button
                  onClick={() => setExpandedScore(expandedScore === s.id ? null : s.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs text-left hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <span className="font-medium text-foreground">{s.judgeName}</span>
                    <span className="ml-1 text-muted-foreground">({s.judgeEmail})</span>
                    <span className="ml-2 text-muted-foreground">→ Team {getDisplayTeamNumber(s.teamNumber)}</span>
                    <span className="ml-2 text-muted-foreground">{ROUND_LABELS[s.round]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums text-foreground">{s.totalScore}/100</span>
                    {expandedScore === s.id ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </button>
                {expandedScore === s.id && (
                  <div className="border-t border-border px-3 py-3 space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {JUDGING_CATEGORIES.map(cat => {
                        const cs = s.categoryScores.find(c => c.categoryId === cat.id);
                        return (
                          <div key={cat.id} className="flex justify-between">
                            <span className="text-muted-foreground">{cat.name}</span>
                            <span className="tabular-nums font-medium text-foreground">{cs?.score ?? 0}/{cat.maxScore}</span>
                          </div>
                        );
                      })}
                    </div>
                    {s.categoryScores.some(c => c.comment) && (
                      <div className="space-y-1 pt-2 border-t border-border text-xs">
                        {s.categoryScores.filter(c => c.comment).map(c => {
                          const cat = JUDGING_CATEGORIES.find(j => j.id === c.categoryId);
                          return (
                            <div key={c.categoryId} className="text-muted-foreground">
                              <span className="font-medium text-foreground">{cat?.name}:</span> "{c.comment}"
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-1">
                      Submitted: {new Date(s.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
