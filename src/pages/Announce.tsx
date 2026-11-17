import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJudging } from '@/context/JudgingContext';
import { ROUND_LABELS, FINAL_ROUNDS, ADVANCEMENT_MAP, PRIMARY_ROUNDS, Round } from '@/types/judging';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';
import { Trophy, ChevronRight, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

const medalEmoji = ['🥇', '🥈', '🥉'];
const placeLabels = ['1st Place', '2nd Place', '3rd Place'];

export default function AnnouncePage() {
  const { getLeaderboard, getTeam, currentRound, getDisplayTeamNumber } = useJudging();
  const [revealed, setRevealed] = useState(0); // how many winners revealed (0 = none, 1 = 3rd, 2 = 2nd, 3 = 1st)
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine which round to show winners for (prefer final, fallback to primary)
  const finalRound: Round | undefined = FINAL_ROUNDS.includes(currentRound)
    ? currentRound
    : Object.keys(ADVANCEMENT_MAP).find(fr => {
        const pr = ADVANCEMENT_MAP[fr as Round];
        return pr === currentRound;
      }) as Round | undefined;

  const displayRound = finalRound || currentRound;
  const rankings = getLeaderboard(displayRound);
  const top3 = rankings.slice(0, 3);

  // Reveal order: 3rd → 2nd → 1st
  const revealOrder = [...top3].reverse();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard: Space/Right to reveal next, Escape to exit fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        setRevealed(prev => Math.min(prev + 1, 3));
      } else if (e.key === 'ArrowLeft') {
        setRevealed(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const getTeamLabel = (num: number) => {
    const team = getTeam(num);
    const d = getDisplayTeamNumber(num);
    return team ? `Team ${d}: ${team.teamName}` : `Team ${d}`;
  };

  const getProjectName = (num: number) => {
    const team = getTeam(num);
    return team?.projectName || '';
  };

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <MicrosoftLogo size={28} />
          <div>
            <h1 className="text-sm font-bold text-foreground">Winner Announcement</h1>
            <p className="text-[11px] text-muted-foreground">{ROUND_LABELS[displayRound]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={toggleFullscreen}>
            <Maximize className="h-3.5 w-3.5" />
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setRevealed(prev => Math.min(prev + 1, 3))}
            disabled={revealed >= 3}
          >
            Reveal Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          {revealed > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setRevealed(0)}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {top3.length < 3 ? (
          <div className="text-center space-y-4">
            <Trophy className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg text-muted-foreground">Not enough scores to announce winners yet.</p>
            <p className="text-sm text-muted-foreground">Need at least 3 ranked teams in {ROUND_LABELS[displayRound]}.</p>
          </div>
        ) : (
          <>
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                🏆 Agent-a-Thon Winners
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">{ROUND_LABELS[displayRound]}</p>
            </motion.div>

            {/* Winners slots - always show 3 placeholders */}
            <div className="flex flex-col-reverse sm:flex-row items-end justify-center gap-6 sm:gap-10 w-full max-w-4xl">
              {/* 2nd place (left) */}
              <WinnerSlot
                place={1}
                team={revealOrder[1]}
                revealed={revealed >= 2}
                getTeamLabel={getTeamLabel}
                getProjectName={getProjectName}
                height="h-48 sm:h-56"
              />
              {/* 1st place (center, tallest) */}
              <WinnerSlot
                place={0}
                team={revealOrder[2]}
                revealed={revealed >= 3}
                getTeamLabel={getTeamLabel}
                getProjectName={getProjectName}
                height="h-56 sm:h-72"
              />
              {/* 3rd place (right) */}
              <WinnerSlot
                place={2}
                team={revealOrder[0]}
                revealed={revealed >= 1}
                getTeamLabel={getTeamLabel}
                getProjectName={getProjectName}
                height="h-40 sm:h-44"
              />
            </div>

            {/* Instructions */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-sm text-muted-foreground"
            >
              Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">Space</kbd> or click "Reveal Next" to announce winners
            </motion.p>
          </>
        )}
      </div>
    </div>
  );
}

function WinnerSlot({
  place,
  team,
  revealed,
  getTeamLabel,
  getProjectName,
  height,
}: {
  place: number;
  team?: { teamNumber: number; averageScore: number; numberOfJudges: number };
  revealed: boolean;
  getTeamLabel: (num: number) => string;
  getProjectName: (num: number) => string;
  height: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center w-full max-w-xs">
      <AnimatePresence mode="wait">
        {revealed && team ? (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', duration: 0.8, bounce: 0.3 }}
            className="text-center mb-4"
          >
            <div className="text-5xl sm:text-6xl mb-2">{medalEmoji[place]}</div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">{getTeamLabel(team.teamNumber)}</h3>
            <p className="text-sm text-muted-foreground mt-1">{getProjectName(team.teamNumber)}</p>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              Avg: {team.averageScore} · {team.numberOfJudges} judges
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="hidden"
            className="text-center mb-4"
          >
            <div className="text-5xl sm:text-6xl mb-2 opacity-20">❓</div>
            <h3 className="text-xl sm:text-2xl font-bold text-muted-foreground/30">{placeLabels[place]}</h3>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Podium block */}
      <div
        className={`w-full ${height} rounded-t-2xl transition-all duration-500 ${
          revealed
            ? place === 0
              ? 'bg-gradient-to-t from-primary/30 to-primary/10 border-2 border-primary/30 border-b-0'
              : place === 1
                ? 'bg-gradient-to-t from-secondary to-secondary/50 border-2 border-border border-b-0'
                : 'bg-gradient-to-t from-secondary/80 to-secondary/30 border-2 border-border border-b-0'
            : 'bg-muted/30 border-2 border-dashed border-border/50 border-b-0'
        }`}
      />
    </div>
  );
}
