import { useState } from 'react';
import { motion } from 'framer-motion';
import { useJudging } from '@/context/JudgingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';

const JUDGE_PASSWORD: string | null = null; // No password stored in code

export function LoginPage() {
  const { setJudge, setIsAdmin } = useJudging();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent, admin = false) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    if (password !== JUDGE_PASSWORD) {
      setError('Incorrect access code.');
      return;
    }
    setJudge({ name: name.trim(), email: email.trim().toLowerCase() });
    if (admin) setIsAdmin(true);
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
            <MicrosoftLogo size={40} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Agent-a-Thon
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build AI Agents in Copilot Studio
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Judging Portal
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 card-shadow">
          <form onSubmit={e => handleSubmit(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Judge Name</label>
              <Input
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="Enter your name"
                className="h-10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Judge Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="Enter your email"
                className="h-10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Access Code</label>
              <Input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter access code"
                className="h-10"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-10 w-full rounded-md text-sm font-semibold" size="lg">
              Start Judging
            </Button>
            <button
              type="button"
              onClick={e => handleSubmit(e as any, true)}
              className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Login as Admin
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Saturday, March 21, 2026 · 9:00 AM – 4:00 PM EST</p>
          <p>Renaissance Baltimore Harborplace Hotel</p>
          <p className="mt-1 font-semibold text-foreground">NSBE Annual Convention</p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MicrosoftLogo size={14} />
          <span>Created by HeyRavon.ai</span>
        </div>
      </motion.div>
    </div>
  );
}
