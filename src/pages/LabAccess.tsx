import { Link } from 'react-router-dom';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';
import { Monitor, MousePointerClick, ShieldAlert, Wifi, BookOpen, KeyRound, FileText, AlertTriangle } from 'lucide-react';

const steps = [
  {
    icon: <MousePointerClick className="h-5 w-5 text-primary" />,
    number: 1,
    title: 'Join the Session',
    content: 'Use the same meeting invite link that you used to join the session by clicking the "Attend Event > Join Now" button.',
  },
  {
    icon: <Monitor className="h-5 w-5 text-primary" />,
    number: 2,
    title: 'Launch the Lab',
    content: 'Click the "Launch Lab" button. Your lab environment will open in a new browser tab.',
  },
  {
    icon: <ShieldAlert className="h-5 w-5 text-primary" />,
    number: 3,
    title: 'Disable Pop-up Blocker',
    content: 'If your browser blocks pop-ups, the lab may not appear. Disable your pop-up blocker and try again.',
  },
  {
    icon: <Wifi className="h-5 w-5 text-primary" />,
    number: 4,
    title: 'Disconnect VPNs',
    content: 'Disconnect from any VPNs — they may interfere with RDP traffic.',
  },
  {
    icon: <BookOpen className="h-5 w-5 text-primary" />,
    number: 5,
    title: 'Follow the Guide Tab',
    content: 'Once provisioning is complete, step-by-step instructions will appear on the "Guide" tab within your lab environment.',
  },
  {
    icon: <KeyRound className="h-5 w-5 text-primary" />,
    number: 6,
    title: 'Find Your Credentials',
    content: 'Login credentials are under the "Environment" tab in the lab panel.',
  },
];

export default function LabAccess() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <MicrosoftLogo size={28} />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Agent-a-Thon</h1>
              <p className="text-[11px] text-muted-foreground">Lab Access Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/rules" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
              📋 Rules
            </Link>
            <Link to="/" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
              🏠 Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
          <h2 className="text-xl font-bold text-foreground">🖥️ Accessing Your Lab Environment</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Follow these quick steps to launch and navigate your hands-on lab for the Agent Sprint.
          </p>
        </div>

        {/* Step-by-step PDF link */}
        <a
          href="/Attendee_Guide_Eventday.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 hover:bg-primary/10 transition-colors group"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 group-hover:bg-primary/25 transition-colors">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">📄 Step-by-Step Instructions (PDF)</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Open the full attendee guide with detailed, illustrated walkthrough for accessing your lab environment.
            </p>
          </div>
        </a>

        {/* Quick Reference Steps */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Quick Reference</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-border bg-card p-4 card-shadow flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {step.icon}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    <span className="text-primary mr-1">Step {step.number}:</span>{step.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-foreground">Troubleshooting</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you experience issues with the lab VM, refer to the{' '}
            <a
              href="https://learner-docs.cloudlabs.ai/Learner/Troubleshooting/RDP/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              CloudLabs RDP Troubleshooting Guide
            </a>{' '}
            for known issues and solutions.
          </p>
        </div>
      </div>
    </div>
  );
}
