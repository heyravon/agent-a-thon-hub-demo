import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Gavel } from 'lucide-react';
import { useJudging } from '@/context/JudgingContext';
import { ROUND_LABELS, PRIMARY_ROUNDS, FINAL_ROUNDS, ADVANCEMENT_MAP, Round, FINALISTS_COUNT } from '@/types/judging';

export function Leaderboard() {
  const { currentRound, getLeaderboard, getTeam, getTeamJudges, getDisplayTeamNumber } = useJudging();

  // Determine the primary/final pair based on currentRound
  const primaryRound: Round = PRIMARY_ROUNDS.includes(currentRound)
    ? currentRound
    : FINAL_ROUNDS.includes(currentRound)
      ? (ADVANCEMENT_MAP[currentRound] || currentRound)
      : currentRound;

  const finalRound = Object.entries(ADVANCEMENT_MAP).find(([_, pr]) => pr === primaryRound)?.[0] as Round | undefined;

  const [activeTab, setActiveTab] = useState<'primary' | 'final'>('primary');

  const displayRound = activeTab === 'final' && finalRound ? finalRound : primaryRound;
  const rankings = getLeaderboard(displayRound);
  const isFinal = activeTab === 'final';

  // For final tab, show top 8 from primary if no final scores yet
  const primaryRankings = getLeaderboard(primaryRound);
  const top8Teams = primaryRankings.slice(0, FINALISTS_COUNT).map(r => r.teamNumber);

  const medalColors = ['text-gold', 'text-silver', 'text-bronze'];
  const medalEmoji = ['🥇', '🥈', '🥉'];

  const getTeamLabel = (num: number) => {
    const team = getTeam(num);
    const d = getDisplayTeamNumber(num);
    return team ? `Team ${d}: ${team.teamName}` : `Team ${d}`;
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Leaderboard</h2>
        <p className="text-xs text-muted-foreground mb-3">{ROUND_LABELS[primaryRound]} / {finalRound ? ROUND_LABELS[finalRound] : 'Final'}</p>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-secondary p-1">
          <button
            onClick={() => setActiveTab('primary')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
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
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'final'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {ROUND_LABELS[finalRound]}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'primary' ? (
        <RankingsList
          rankings={rankings}
          isFinal={false}
          displayRound={primaryRound}
          getTeamLabel={getTeamLabel}
          getTeamJudges={getTeamJudges}
          medalColors={medalColors}
          medalEmoji={medalEmoji}
        />
      ) : (
        <>
          {rankings.length > 0 ? (
            <RankingsList
              rankings={rankings}
              isFinal={true}
              displayRound={finalRound!}
              getTeamLabel={getTeamLabel}
              getTeamJudges={getTeamJudges}
              medalColors={medalColors}
              medalEmoji={medalEmoji}
            />
          ) : (
            <div>
              <div className="rounded-xl bg-card p-5 card-shadow mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Top {FINALISTS_COUNT} Advancing Teams</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Based on {ROUND_LABELS[primaryRound]} scores. No final scores submitted yet.</p>
                {top8Teams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No primary scores yet.</p>
                ) : (
                  <div className="space-y-2">
                    {primaryRankings.slice(0, FINALISTS_COUNT).map((team, i) => (
                        <div key={team.teamNumber} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold tabular-nums text-muted-foreground w-6">#{i + 1}</span>
                            <span className="text-sm font-semibold text-foreground">{getTeamLabel(team.teamNumber)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs tabular-nums text-muted-foreground">Avg: {team.averageScore}</span>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RankingsList({
  rankings,
  isFinal,
  displayRound,
  getTeamLabel,
  getTeamJudges,
  medalColors,
  medalEmoji,
}: {
  rankings: { teamNumber: number; averageScore: number; numberOfJudges: number }[];
  isFinal: boolean;
  displayRound: Round;
  getTeamLabel: (num: number) => string;
  getTeamJudges: (teamNumber: number, round: Round) => string[];
  medalColors: string[];
  medalEmoji: string[];
}) {
  if (rankings.length === 0) {
    return (
      <div className="rounded-xl bg-card p-8 text-center card-shadow">
        <p className="text-sm text-muted-foreground">No scores submitted yet for this round.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[40px_1fr_80px_60px] gap-2 px-4 py-2 text-xs text-muted-foreground">
        <span>Rank</span>
        <span>Team</span>
        <span className="text-right">Avg Score</span>
        <span className="text-right">Judges</span>
      </div>

      {rankings.map((team, i) => {
        const judgeNames = isFinal ? [] : getTeamJudges(team.teamNumber, displayRound);
        return (
          <motion.div
            key={team.teamNumber}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0, delay: i * 0.03 }}
            className={`rounded-xl px-4 py-3 card-shadow ${
              i < 3 && isFinal ? 'bg-card ring-1 ring-primary/20' : 'bg-card'
            }`}
          >
            <div className="grid grid-cols-[40px_1fr_80px_60px] items-center gap-2">
              <span className={`text-sm font-bold tabular-nums ${i < 3 ? medalColors[i] || 'text-foreground' : 'text-muted-foreground'}`}>
                {i < 3 && isFinal ? medalEmoji[i] : `#${i + 1}`}
              </span>
              <span className="text-sm font-semibold text-foreground truncate">{getTeamLabel(team.teamNumber)}</span>
              <span className="text-right text-sm font-semibold tabular-nums text-foreground">{team.averageScore}</span>
              <span className="text-right text-sm tabular-nums text-muted-foreground">{team.numberOfJudges}</span>
            </div>
            {judgeNames.length > 0 && (
              <div className="mt-1.5 ml-10 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Gavel className="h-3 w-3 shrink-0" />
                <span>Judges: <span className="font-medium text-foreground">{judgeNames.join(' & ')}</span></span>
              </div>
            )}
          </motion.div>
        );
      })}

      {isFinal && rankings.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0, delay: 0.3 }}
          className="mt-4 rounded-2xl bg-primary/5 p-6 text-center card-shadow"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">🏆 Winners</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {rankings.slice(0, 3).map((team, i) => (
              <div key={team.teamNumber} className="rounded-xl bg-card px-6 py-4 card-shadow">
                <div className="text-2xl">{medalEmoji[i]}</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{getTeamLabel(team.teamNumber)}</div>
                <div className="text-xs tabular-nums text-muted-foreground">Avg: {team.averageScore}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
