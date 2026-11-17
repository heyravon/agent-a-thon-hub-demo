import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useJudging } from '@/context/JudgingContext';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Gavel, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { DEMO_JUDGE } from '@/lib/demo';
import { toast } from 'sonner';
import CheckIn from '@/components/CheckIn';

export default function Staff() {
  const navigate = useNavigate();
  const { setJudge } = useJudging();
  const [mode, setMode] = useState<'select' | 'checkin'>('select');
  const enterJudgeDemo = () => {
    setJudge(DEMO_JUDGE);
    toast.success(`Demo mode: viewing as ${DEMO_JUDGE.name}`);
    navigate('/judge');
  };
  const enterAdminDemo = () => navigate('/admin');

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
        className={`w-full ${mode === 'checkin' ? 'max-w-lg' : 'max-w-sm'}`}
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <AppLogo size={40} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === 'checkin' ? 'Event Check-In' : 'Staff Portal'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'checkin' ? 'Mark attendees as present' : 'Demo mode for judge and admin screens'}
          </p>
        </div>

        {mode === 'select' ? (
          <div className="space-y-3">
            <Button onClick={() => setMode('checkin')} variant="default" className="h-14 w-full gap-3 text-base font-semibold" size="lg">
              <ClipboardCheck className="h-5 w-5" />
              Event Check-In
            </Button>
            <Button onClick={enterJudgeDemo} variant="outline" className="h-14 w-full gap-3 text-base font-semibold" size="lg">
              <Gavel className="h-5 w-5" />
              Demo mode: Judge screen
            </Button>
            <Button onClick={enterAdminDemo} variant="outline" className="h-14 w-full gap-3 text-base font-semibold" size="lg">
              <ShieldCheck className="h-5 w-5" />
              Demo mode: Admin screen
            </Button>
            <p className="pt-1 text-center text-xs text-muted-foreground">No sign-in needed. Demo, changes are not saved.</p>
          </div>
        ) : mode === 'checkin' ? (
          <div>
            <p className="mb-3 rounded-md border border-border bg-muted px-3 py-2 text-center text-xs text-muted-foreground">Demo, changes are not saved. Attendee details are kept private.</p>
            <CheckIn />
            <div className="mt-4 text-center">
              <Button variant="ghost" className="text-xs" onClick={() => setMode('select')}>
                ← Back
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to main site
          </Link>
        </div>
      </motion.div>
    </div>
  );
}