import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import { useJudging } from '@/context/JudgingContext';
import { TeamList } from '@/components/TeamList';
import { ScoringView } from '@/components/ScoringView';
import { Leaderboard } from '@/components/Leaderboard';
import { AdminPanel } from '@/components/AdminPanel';
import { FINAL_ROUNDS, ROUND_LABELS } from '@/types/judging';

type Tab = 'judging' | 'leaderboard' | 'admin';

export function JudgeDashboard() {
  const { isAdmin, currentRound } = useJudging();
  const [activeTab, setActiveTab] = useState<Tab>('judging');
  const [scoringTeam, setScoringTeam] = useState<number | null>(null);
  const isFinalRound = FINAL_ROUNDS.includes(currentRound);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'judging', label: 'Judging' },
    { key: 'leaderboard', label: 'Leaderboard' },
    ...(isAdmin ? [{ key: 'admin' as Tab, label: 'Admin' }] : []),
  ];

  if (scoringTeam !== null) {
    return (
      <AnimatePresence mode="wait">
        <ScoringView
          key={scoringTeam}
          teamNumber={scoringTeam}
          onBack={() => setScoringTeam(null)}
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      {/* Final Round Banner */}
      {isFinalRound && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-ms-blue via-ms-green to-ms-yellow p-[2px] rounded-2xl">
            <div className="rounded-[14px] bg-card px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ms-blue to-ms-green">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">🏆 {ROUND_LABELS[currentRound]}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-ms-yellow/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ms-orange">
                      <Zap className="h-3 w-3" /> Live
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Top 8 teams competing · All judges scoring</p>
                </div>
              </div>
              {/* Microsoft color bar */}
              <div className="mt-3 flex h-1 rounded-full overflow-hidden">
                <div className="flex-1 bg-ms-red" />
                <div className="flex-1 bg-ms-green" />
                <div className="flex-1 bg-ms-blue" />
                <div className="flex-1 bg-ms-yellow" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Bar */}
      <div className={`mb-4 flex gap-1 rounded-xl p-1 ${isFinalRound ? 'bg-gradient-to-r from-ms-blue/10 via-ms-green/10 to-ms-yellow/10 border border-ms-blue/20' : 'bg-secondary'}`}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? isFinalRound
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-ms-blue/20'
                  : 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'judging' && <TeamList onSelectTeam={setScoringTeam} />}
      {activeTab === 'leaderboard' && <Leaderboard />}
      {activeTab === 'admin' && <AdminPanel />}
    </div>
  );
}
