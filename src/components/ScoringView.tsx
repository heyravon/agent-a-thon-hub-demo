import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users } from 'lucide-react';
import { useJudging } from '@/context/JudgingContext';
import { JUDGING_CATEGORIES, ROUND_LABELS, CategoryScore } from '@/types/judging';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ScoringViewProps {
  teamNumber: number;
  onBack: () => void;
}

export function ScoringView({ teamNumber, onBack }: ScoringViewProps) {
  const { judge, currentRound, saveScore, getScoreForTeam, config, getTeam } = useJudging();
  const existingScore = getScoreForTeam(teamNumber, currentRound);
  const isLocked = config.lockedRounds.includes(currentRound);
  const team = getTeam(teamNumber);

  const [categoryScores, setCategoryScores] = useState<Record<string, { score: string; comment: string }>>(() => {
    const initial: Record<string, { score: string; comment: string }> = {};
    JUDGING_CATEGORIES.forEach(c => {
      const existing = existingScore?.categoryScores.find(cs => cs.categoryId === c.id);
      initial[c.id] = { score: existing ? String(existing.score) : '', comment: existing?.comment || '' };
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Scroll to top when entering scoring view
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Demo timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const totalScore = JUDGING_CATEGORIES.reduce((sum, c) => {
    const val = parseInt(categoryScores[c.id]?.score || '0');
    return sum + (isNaN(val) ? 0 : Math.min(val, c.maxScore));
  }, 0);

  const allFieldsFilled = JUDGING_CATEGORIES.every(c => categoryScores[c.id]?.score !== '');

  const handleSave = useCallback(async () => {
    if (!judge || isLocked) return;
    if (!allFieldsFilled) {
      setShowErrors(true);
      toast.error('Please fill in all scoring fields before saving.');
      return;
    }
    const entries: CategoryScore[] = JUDGING_CATEGORIES.map(c => ({
      categoryId: c.id,
      score: Math.min(parseInt(categoryScores[c.id]?.score || '0') || 0, c.maxScore),
      comment: categoryScores[c.id]?.comment || '',
    }));
    setSaving(true);
    try {
      await saveScore({
        judgeName: judge.name,
        judgeEmail: judge.email,
        teamNumber,
        round: currentRound,
        categoryScores: entries,
        totalScore,
      });
      toast.success(`Score for Team ${teamNumber} saved.`);
      onBack();
    } catch {
      toast.error('Failed to save score. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [judge, categoryScores, teamNumber, currentRound, totalScore, saveScore, onBack, isLocked, allFieldsFilled]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const { getDisplayTeamNumber } = useJudging();
  const displayNum = getDisplayTeamNumber(teamNumber);
  const teamLabel = team ? `Team ${displayNum}: ${team.teamName}` : `Team ${displayNum}`;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
      className="min-h-svh pb-24"
    >
      {/* Header */}
      <div className="sticky top-[57px] z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{teamLabel}</h2>
              <p className="text-xs text-muted-foreground">{ROUND_LABELS[currentRound]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { if (!timerRunning) setTimeLeft(120); setTimerRunning(!timerRunning); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                timerRunning
                  ? timeLeft <= 30 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        {/* Team Info Card */}
        {team && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-5 card-shadow"
          >
            <div className="flex gap-4">
              {team.photoUrl && (
                <img
                  src={team.photoUrl}
                  alt={`Team ${teamNumber} photo`}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">{team.projectName}</h3>
                {team.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{team.description}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{team.members.join(', ')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isLocked && (
          <div className="rounded-xl bg-warning/10 p-3 text-center text-sm font-medium text-warning">
            This round is locked. Scores cannot be modified.
          </div>
        )}

        {/* Scoring Cards */}
        {JUDGING_CATEGORIES.map(cat => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className="rounded-2xl bg-card p-5 card-shadow"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{cat.description}</p>
              </div>
              <span className="ml-3 shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-medium tabular-nums text-secondary-foreground">
                0–{cat.maxScore}
              </span>
            </div>
            <input
              type="number"
              min={0}
              max={cat.maxScore}
              disabled={isLocked}
              value={categoryScores[cat.id]?.score || ''}
              onChange={e => {
                const val = e.target.value;
                if (val === '' || (Number(val) >= 0 && Number(val) <= cat.maxScore)) {
                  setCategoryScores(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], score: val } }));
                }
              }}
              placeholder={`Score (0-${cat.maxScore}) *`}
              className={`mb-1 h-12 w-full rounded-lg border bg-background px-4 text-lg tabular-nums text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                showErrors && !categoryScores[cat.id]?.score ? 'border-destructive ring-1 ring-destructive' : 'border-input'
              }`}
            />
            {showErrors && !categoryScores[cat.id]?.score && (
              <p className="text-xs text-destructive">Score is required</p>
            )}
          </motion.div>
        ))}

        {/* Total */}
        <div className="rounded-2xl bg-primary/5 p-5 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total Score</span>
            <span className="text-2xl font-bold tabular-nums text-primary">{totalScore} <span className="text-sm font-normal text-muted-foreground">/ 100</span></span>
          </div>
        </div>
      </div>

      {/* Fixed Save Button */}
      {!isLocked && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-12 w-full rounded-xl text-base font-semibold"
              size="lg"
            >
              {saving ? 'Saving...' : existingScore ? 'Update Score' : 'Save Score'}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
