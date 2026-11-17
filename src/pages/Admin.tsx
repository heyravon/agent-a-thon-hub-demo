import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminPanel } from '@/components/AdminPanel';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_PASSWORDS: string[] = []; // No passwords stored in code

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ADMIN_PASSWORDS.includes(password)) {
      setAuthenticated(true);
      toast.success('Welcome, Admin!');
    } else {
      toast.error('Incorrect password.');
    }
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <MicrosoftLogo size={36} />
            <h1 className="mt-4 text-2xl font-semibold text-foreground">Admin Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter the admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="rounded-xl border border-border bg-card p-6 card-shadow space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="h-11 pl-10"
                autoFocus
              />
            </div>
            <Button type="submit" className="h-11 w-full font-semibold">Sign In</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-4xl p-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MicrosoftLogo size={28} />
            <h1 className="text-xl font-semibold text-foreground">Admin Portal</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAuthenticated(false)}>Sign Out</Button>
        </div>
        <AdminPanel />
      </div>
    </div>
  );
}
