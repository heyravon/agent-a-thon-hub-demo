import { Link } from 'react-router-dom';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';
import { InstructionsPanel } from '@/components/InstructionsPanel';

export default function Rules() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <MicrosoftLogo size={28} />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Agent-a-Thon</h1>
              <p className="text-[11px] text-muted-foreground">Competition Rules & Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/register" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
              ✍️ Register
            </Link>
            <Link to="/leaderboard" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <InstructionsPanel />
      </div>
    </div>
  );
}
