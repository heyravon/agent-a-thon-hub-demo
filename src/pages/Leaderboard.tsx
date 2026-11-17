import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useJudging } from '@/context/JudgingContext';
import { AppLogo } from '@/components/AppLogo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ROUND_LABELS, JUDGING_CATEGORIES, Round, ADVANCEMENT_MAP, PRIMARY_ROUNDS, FINAL_ROUNDS, FINALISTS_COUNT, TEST_ROUNDS, OFFICIAL_ROUNDS } from '@/types/judging';
import { Trophy, Search, Users, Gavel } from 'lucide-react';

export default function LeaderboardPage() {
  const { scores, getLeaderboard, getTeam, teams, config, currentRound, getTeamJudges, getDisplayTeamNumber, shouldRenumber } = useJudging();
  const [teamLookup, setTeamLookup] = useState('');
  const [lookupResult, setLookupResult] = useState<number | null>(null);

  // Determine primary/final pair
  const primaryRound: Round = PRIMARY_ROUNDS.includes(currentRound)
    ? currentRound
    : FINAL_ROUNDS.includes(currentRound)
      ? (ADVANCEMENT_MAP[currentRound] || currentRound)
      : currentRound;

  const finalRound = Object.entries(ADVANCEMENT_MAP).find(([_, pr]) => pr === primaryRound)?.[0] as Round | undefined;

  const [activeTab, setActiveTab] = useState<'primary' | 'final'>('primary');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(teamLookup);
    if (!isNaN(num)) {
      // Check both raw team number and display number
      const byRaw = teams.find(t => t.teamNumber === num);
      const byDisplay = teams.find(t => getDisplayTeamNumber(t.teamNumber) === num);
      const found = byRaw || byDisplay;
      if (found) { setLookupResult(found.teamNumber); return; }
    }
    const found = teams.find(t => t.teamName.toLowerCase().includes(teamLookup.toLowerCase()));
    if (found) setLookupResult(found.teamNumber);
    else setLookupResult(-1);
  };

  const visibleRounds = config.competitionDayMode ? OFFICIAL_ROUNDS : TEST_ROUNDS;
  const teamScores = lookupResult && lookupResult > 0
    ? scores.filter(s => s.teamNumber === lookupResult && visibleRounds.includes(s.round as Round))
    : [];

  const lookedUpTeam = lookupResult && lookupResult > 0 ? getTeam(lookupResult) : null;

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <AppLogo size={28} />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Agent-a-Thon</h1>
              <p className="text-[11px] text-muted-foreground">Leaderboard & Scores</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/register" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
              ✍️ Register
            </Link>
            {!shouldRenumber && (
              <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
                <Trophy className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">{teams.length}</span> teams
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Round Tabs */}
        <div className="flex gap-1 rounded-xl bg-secondary p-1">
          <button
            onClick={() => setActiveTab('primary')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'primary'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {ROUND_LABELS[primaryRound]}
          </button>
          {finalRound && (
            <button
              onClick={() => setActiveTab('final')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'final'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {ROUND_LABELS[finalRound]}
            </button>
          )}
        </div>

        {/* Leaderboard Content */}
        {activeTab === 'primary' ? (
          <motion.div key="primary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <LeaderboardView round={primaryRound} getTeamJudges={getTeamJudges} />
          </motion.div>
        ) : finalRound ? (
          <motion.div key="final" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <FinalRoundView primaryRound={primaryRound} finalRound={finalRound} getTeamJudges={getTeamJudges} />
          </motion.div>
        ) : null}

        {/* All Registered Teams — shown after rankings */}
        <RegisteredTeamsList teams={teams} currentRound={currentRound} getTeamJudges={getTeamJudges} />

        {/* Team Score Lookup */}
        <TeamLookup
          teamLookup={teamLookup}
          setTeamLookup={setTeamLookup}
          lookupResult={lookupResult}
          setLookupResult={setLookupResult}
          handleLookup={handleLookup}
          lookedUpTeam={lookedUpTeam}
          teamScores={teamScores}
        />
      </div>
    </div>
  );
}

// Final round view: shows scores if available, otherwise top 8 from primary
function FinalRoundView({ primaryRound, finalRound, getTeamJudges }: { primaryRound: Round; finalRound: Round; getTeamJudges: (teamNumber: number, round: Round) => string[] }) {
  const { getLeaderboard, getTeam, getDisplayTeamNumber } = useJudging();
  const finalRankings = getLeaderboard(finalRound);
  const primaryRankings = getLeaderboard(primaryRound);

  const getTeamLabel = (num: number) => {
    const team = getTeam(num);
    const d = getDisplayTeamNumber(num);
    return team ? `Team ${d}: ${team.teamName}` : `Team ${d}`;
  };

  if (finalRankings.length > 0) {
    return <LeaderboardView round={finalRound} getTeamJudges={getTeamJudges} />;
  }

  // No final scores yet — show top 8 from primary
  const top8 = primaryRankings.slice(0, FINALISTS_COUNT);

  return (
    <div className="rounded-2xl border border-border bg-card card-shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-base font-bold text-foreground">Top {FINALISTS_COUNT} Advancing to {ROUND_LABELS[finalRound]}</h3>
      </div>
      {top8.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No primary round scores yet. Top {FINALISTS_COUNT} will appear here.</p>
        </div>
      ) : (
        <>
          <div className="px-5 py-2 text-xs text-muted-foreground bg-secondary/10">
            Based on {ROUND_LABELS[primaryRound]} scores. No final scores submitted yet.
          </div>
          <div className="divide-y divide-border">
            {top8.map((team, i) => (
              <motion.div
                key={team.teamNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="px-5 py-3 hover:bg-secondary/20 transition-colors"
              >
                <div className="grid grid-cols-[48px_1fr_80px_60px] items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-muted-foreground">#{i + 1}</span>
                  <span className="text-sm font-semibold text-foreground truncate">{getTeamLabel(team.teamNumber)}</span>
                  <span className="text-right text-sm font-semibold tabular-nums text-foreground">{team.averageScore}</span>
                  <span className="text-right text-sm tabular-nums text-muted-foreground">{team.numberOfJudges}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Leaderboard rankings for a specific round
function LeaderboardView({ round, getTeamJudges }: { round: Round; getTeamJudges: (teamNumber: number, round: Round) => string[] }) {
  const { getLeaderboard, getTeam, getDisplayTeamNumber } = useJudging();
  const rankings = getLeaderboard(round);
  const isFinal = FINAL_ROUNDS.includes(round);
  const medalColors = ['text-gold', 'text-silver', 'text-bronze'];
  const medalEmoji = ['🥇', '🥈', '🥉'];

  const getTeamLabel = (num: number) => {
    const team = getTeam(num);
    const d = getDisplayTeamNumber(num);
    return team ? `Team ${d}: ${team.teamName}` : `Team ${d}`;
  };

  if (rankings.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-10 text-center card-shadow">
        <Trophy className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No scores submitted yet for this round.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isFinal && rankings.length >= 3 && (
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
          <h3 className="mb-4 text-center text-lg font-bold text-foreground">🏆 Winners</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {rankings.slice(0, 3).map((team, i) => (
              <div key={team.teamNumber} className="flex-1 rounded-xl bg-card px-5 py-4 card-shadow text-center">
                <div className="text-2xl">{medalEmoji[i]}</div>
                <div className="mt-1 text-sm font-bold text-foreground">{getTeamLabel(team.teamNumber)}</div>
                <div className="text-xs tabular-nums text-muted-foreground">Avg: {team.averageScore} · {team.numberOfJudges} judges</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden card-shadow">
        <div className="grid grid-cols-[48px_1fr_80px_60px] gap-2 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border bg-secondary/30">
          <span>Rank</span>
          <span>Team</span>
          <span className="text-right">Avg Score</span>
          <span className="text-right">Judges</span>
        </div>
        <div className="divide-y divide-border">
          {rankings.map((team, i) => {
            const judges = isFinal ? [] : getTeamJudges(team.teamNumber, round);
            return (
              <motion.div
                key={team.teamNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="px-5 py-3 hover:bg-secondary/20 transition-colors"
              >
                <div className="grid grid-cols-[48px_1fr_80px_60px] items-center gap-2">
                  <span className={`text-sm font-bold tabular-nums ${i < 3 ? medalColors[i] : 'text-muted-foreground'}`}>
                    {i < 3 && isFinal ? medalEmoji[i] : `#${i + 1}`}
                  </span>
                  <span className="text-sm font-semibold text-foreground truncate">{getTeamLabel(team.teamNumber)}</span>
                  <span className="text-right text-sm font-semibold tabular-nums text-foreground">{team.averageScore}</span>
                  <span className="text-right text-sm tabular-nums text-muted-foreground">{team.numberOfJudges}</span>
                </div>
                {judges.length > 0 && (
                  <div className="mt-1 ml-12 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Gavel className="h-3 w-3 shrink-0" />
                    <span>Judges: <span className="font-medium text-foreground">{judges.join(' & ')}</span></span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Registered teams list
function RegisteredTeamsList({ teams, currentRound, getTeamJudges }: { teams: any[]; currentRound: Round; getTeamJudges: (teamNumber: number, round: Round) => string[] }) {
  const { getDisplayTeamNumber } = useJudging();
  // Determine the primary round to use as fallback for judge display
  const primaryRound: Round = PRIMARY_ROUNDS.includes(currentRound)
    ? currentRound
    : FINAL_ROUNDS.includes(currentRound)
      ? (ADVANCEMENT_MAP[currentRound] || currentRound)
      : currentRound;

  return (
    <div className="rounded-2xl border border-border bg-card card-shadow overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-base font-bold text-foreground">All Registered Teams</h3>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{teams.length} teams</span>
      </div>
      {teams.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No teams registered yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {teams.map((team, i) => {
            // Always show primary round judges for the registered teams list
            const judges = getTeamJudges(team.teamNumber, primaryRound);
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="px-5 py-3 hover:bg-secondary/20 transition-colors"
              >
                <div className="grid grid-cols-[48px_1fr_1fr] items-center gap-3">
                  <span className="text-sm font-bold tabular-nums text-muted-foreground">#{getDisplayTeamNumber(team.teamNumber)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{team.teamName}</p>
                    <p className="text-xs text-muted-foreground truncate">{team.members.join(', ')}</p>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-sm text-foreground truncate">{team.projectName}</p>
                  </div>
                </div>
                {judges.length > 0 && (
                  <div className="mt-1.5 ml-12 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Gavel className="h-3 w-3 shrink-0" />
                    <span>Judges: <span className="font-medium text-foreground">{judges.join(' & ')}</span></span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Team score lookup
function TeamLookup({ teamLookup, setTeamLookup, lookupResult, setLookupResult, handleLookup, lookedUpTeam, teamScores }: any) {
  const { getDisplayTeamNumber } = useJudging();
  return (
    <div className="rounded-2xl border border-border bg-card p-6 card-shadow">
      <h3 className="text-base font-bold text-foreground mb-1">🔍 Look Up Your Team's Scores</h3>
      <p className="text-xs text-muted-foreground mb-4">Enter your team number or name to see your detailed scores.</p>

      <form onSubmit={handleLookup} className="flex gap-2">
        <Input
          value={teamLookup}
          onChange={(e: any) => { setTeamLookup(e.target.value); setLookupResult(null); }}
          placeholder="Team number or name..."
          className="h-11"
        />
        <Button type="submit" className="h-11 px-6 shrink-0">
          <Search className="h-4 w-4 mr-1.5" /> Search
        </Button>
      </form>

      {lookupResult === -1 && (
        <p className="mt-4 text-sm text-destructive">Team not found. Check your team number or name.</p>
      )}

      {lookedUpTeam && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5">
            <h4 className="text-lg font-bold text-foreground">
              Team {getDisplayTeamNumber(lookedUpTeam.teamNumber)}: {lookedUpTeam.teamName}
            </h4>
            <p className="text-sm text-muted-foreground">{lookedUpTeam.projectName}</p>
            {lookedUpTeam.description && (
              <p className="mt-1 text-xs text-muted-foreground">{lookedUpTeam.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Members: {lookedUpTeam.members.join(', ')}
            </p>
          </div>

          {teamScores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scores submitted for this team yet.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{teamScores.length} score(s) received:</p>
              {teamScores.map((s: any) => (
                <div key={s.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">{ROUND_LABELS[s.round as Round]}</span>
                    </div>
                    <span className="text-lg font-bold tabular-nums text-foreground">{s.totalScore}<span className="text-muted-foreground font-normal">/100</span></span>
                  </div>

                  <div className="space-y-2">
                    {JUDGING_CATEGORIES.map(cat => {
                      const cs = s.categoryScores.find((c: any) => c.categoryId === cat.id);
                      const score = cs?.score ?? 0;
                      const pct = (score / cat.maxScore) * 100;
                      return (
                        <div key={cat.id}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{cat.name}</span>
                            <span className="tabular-nums font-medium text-foreground">{score}/{cat.maxScore}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {s.categoryScores.some((c: any) => c.comment) && (
                    <div className="border-t border-border pt-3 space-y-1.5">
                      <p className="text-xs font-medium text-foreground">Comments:</p>
                      {s.categoryScores.filter((c: any) => c.comment).map((c: any) => {
                        const cat = JUDGING_CATEGORIES.find(j => j.id === c.categoryId);
                        return (
                          <p key={c.categoryId} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{cat?.name}:</span> {c.comment}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
