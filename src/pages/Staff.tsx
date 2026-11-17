import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useJudging } from '@/context/JudgingContext';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gavel, ShieldCheck, Lock, User, Mail, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import CheckIn from '@/components/CheckIn';

const ADMIN_PASSWORDS: string[] = []; // No passwords stored in code
const JUDGE_ACCESS_CODE: string | null = null; // No access code stored in code

export default function Staff() {
  const navigate = useNavigate();
  const { setJudge } = useJudging();
  const [mode, setMode] = useState<'select' | 'judge' | 'admin' | 'checkin'>('select');
  const [code, setCode] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [judgeEmail, setJudgeEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'judge') {
      if (!judgeName.trim() || !judgeEmail.trim()) {
        toast.error('Please enter your name and email.');
        return;
      }
      if (!judgeEmail.includes('@')) {
        toast.error('Please enter a valid email.');
        return;
      }
      if (!JUDGE_ACCESS_CODE || code !== JUDGE_ACCESS_CODE) {
        toast.error('Invalid access code.');
        return;
      }
      setJudge({ name: judgeName.trim(), email: judgeEmail.trim().toLowerCase() });
      toast.success(`Welcome, ${judgeName.trim()}!`);
      navigate('/judge');
    } else if (mode === 'admin') {
      if (ADMIN_PASSWORDS.includes(code)) {
        navigate('/admin');
      } else {
        toast.error('Invalid password.');
      }
    }
  };

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
            <MicrosoftLogo size={40} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === 'checkin' ? 'Event Check-In' : 'Staff Portal'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'checkin' ? 'Mark attendees as present' : 'Judge & Admin Access'}
          </p>
        </div>

        {mode === 'select' ? (
          <div className="space-y-3">
            <Button onClick={() => setMode('checkin')} variant="default" className="h-14 w-full gap-3 text-base font-semibold" size="lg">
              <ClipboardCheck className="h-5 w-5" />
              Event Check-In
            </Button>
            <Button onClick={() => setMode('judge')} variant="outline" className="h-14 w-full gap-3 text-base font-semibold" size="lg">
              <Gavel className="h-5 w-5" />
              Judge Login
            </Button>
            <Button onClick={() => setMode('admin')} variant="outline" className="h-14 w-full gap-3 text-base font-semibold" size="lg">
              <ShieldCheck className="h-5 w-5" />
              Admin Login
            </Button>
          </div>
        ) : mode === 'checkin' ? (
          <div>
            <CheckIn />
            <div className="mt-4 text-center">
              <Button variant="ghost" className="text-xs" onClick={() => setMode('select')}>
                ← Back
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 card-shadow space-y-4">
            <div className="text-center mb-2">
              {mode === 'judge' ? (
                <Gavel className="mx-auto h-8 w-8 text-primary mb-2" />
              ) : (
                <ShieldCheck className="mx-auto h-8 w-8 text-primary mb-2" />
              )}
              <h2 className="text-lg font-bold text-foreground">
                {mode === 'judge' ? 'Judge Sign In' : 'Admin Access'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'judge' ? 'Enter your name, email, and access code' : 'Enter the admin password to continue'}
              </p>
            </div>

            {mode === 'judge' && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={judgeName}
                    onChange={e => setJudgeName(e.target.value)}
                    placeholder="Your name"
                    className="h-11 pl-10"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={judgeEmail}
                    onChange={e => setJudgeEmail(e.target.value)}
                    placeholder="Your email"
                    className="h-11 pl-10"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={mode === 'judge' ? 'Access code' : 'Password'}
                className="h-11 pl-10"
                autoFocus={mode === 'admin'}
              />
            </div>
            <Button type="submit" className="h-11 w-full font-semibold">Sign In</Button>
            <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => { setMode('select'); setCode(''); setJudgeName(''); setJudgeEmail(''); }}>
              ← Back
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to main site
          </Link>
        </div>
      </motion.div>
    </div>
  );
}