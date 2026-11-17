import { Link } from 'react-router-dom';
import { AdminPanel } from '@/components/AdminPanel';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { DEMO_NOTICE } from '@/lib/demo';

export default function Admin() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-4xl p-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size={28} />
            <h1 className="text-xl font-semibold text-foreground">Admin Portal</h1>
          </div>
          <Button variant="outline" size="sm" asChild><Link to="/">Exit demo</Link></Button>
        </div>
        <p className="mb-6 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          Demo mode. {DEMO_NOTICE}
        </p>
        <AdminPanel />
      </div>
    </div>
  );
}
