import { motion } from 'framer-motion';
import { useJudging } from '@/context/JudgingContext';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { DEMO_JUDGE, DEMO_NOTICE } from '@/lib/demo';
import { Gavel, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const { setJudge, setIsAdmin } = useJudging();

  const enter = (admin: boolean) => {
    setJudge(DEMO_JUDGE);
    setIsAdmin(admin);
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <AppLogo size={40} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Agent-a-Thon</h1>
          <p className="mt-1 text-sm text-muted-foreground">Judging Portal</p>
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-card p-6 card-shadow">
          <Button className="h-12 w-full gap-2 font-semibold" onClick={() => enter(false)}>
            <Gavel className="h-4 w-4" /> Demo mode: Judge screen
          </Button>
          <Button variant="outline" className="h-12 w-full gap-2 font-semibold" onClick={() => enter(true)}>
            <ShieldCheck className="h-4 w-4" /> Demo mode: Judge + Admin
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You'll view as the fictional judge {DEMO_JUDGE.name}. {DEMO_NOTICE}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
