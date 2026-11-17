import { useJudging } from '@/context/JudgingContext';
import { ROUND_LABELS } from '@/types/judging';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';
import { Users } from 'lucide-react';

export function EventHeader() {
  const { currentRound, judge, setJudge, setIsAdmin, getJudgePartner } = useJudging();
  const partner = getJudgePartner(currentRound);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <MicrosoftLogo size={22} />
            <div>
              <h1 className="text-base font-semibold leading-tight text-foreground sm:text-lg">
                Agent-a-Thon
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                March 21, 2026 · Baltimore · NSBE Convention
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary whitespace-nowrap">
              {ROUND_LABELS[currentRound]}
            </span>
            {partner && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground whitespace-nowrap">
                <Users className="h-3 w-3" />
                Paired with {partner}
              </span>
            )}
            {judge && (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="hidden text-xs text-muted-foreground sm:inline truncate max-w-[120px]">{judge.name}</span>
                <button
                  onClick={() => { setJudge(null); setIsAdmin(false); }}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        {partner && (
          <div className="sm:hidden mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            Paired with <span className="font-medium text-foreground">{partner}</span>
          </div>
        )}
      </div>
    </header>
  );
}