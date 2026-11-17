import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJudging } from '@/context/JudgingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';
import { InstructionsPanel } from '@/components/InstructionsPanel';
import { toast } from 'sonner';
import {
  CheckCircle, Users,
  UserPlus, X,
} from 'lucide-react';
function RegistrationForm({
  onSubmit,
  teamsCount,
  hideTeamCount,
}: {
  onSubmit: (data: { teamName: string; projectName: string; description: string; members: string[] }) => void;
  teamsCount: number;
  hideTeamCount: boolean;
}) {
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<string[]>(['']);

  const handleMemberChange = (index: number, value: string) => {
    setMembers(prev => { const u = [...prev]; u[index] = value; return u; });
  };
  const addMember = () => { if (members.length < 5) setMembers(prev => [...prev, '']); };
  const removeMember = (index: number) => { if (members.length > 1) setMembers(prev => prev.filter((_, i) => i !== index)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !projectName.trim()) { toast.error('Team name and project name are required.'); return; }
    const validMembers = members.map(m => m.trim()).filter(Boolean);
    if (validMembers.length === 0) { toast.error('Please add at least one team member.'); return; }
    onSubmit({ teamName: teamName.trim(), projectName: projectName.trim(), description: description.trim(), members: validMembers });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Register Your Team</h2>
          {!hideTeamCount && <p className="text-xs text-muted-foreground">{teamsCount} teams already registered</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 card-shadow">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Team Name *</label>
            <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g., Herding Cats" className="h-11" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Agent / Project Name *</label>
            <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g., Smart Meeting Scheduler" className="h-11" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Project Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of what your agent does..."
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Team Members * <span className="font-normal text-muted-foreground">(up to 5)</span>
          </label>
          <div className="space-y-2">
            {members.map((member, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={member}
                  onChange={e => handleMemberChange(i, e.target.value)}
                  placeholder={`Member ${i + 1} name`}
                  className="h-11"
                />
                {members.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(i)} className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {members.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={addMember} className="h-9 text-xs gap-1">
                <UserPlus className="h-3.5 w-3.5" /> Add Member
              </Button>
            )}
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl text-sm font-bold" size="lg">
          Register Team
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Your team number will be assigned automatically.
        </p>
      </form>
    </div>
  );
}

export function TeamRegistration() {
  const { registerTeam, teams, teamSubmissionsLocked, shouldRenumber, getDisplayTeamNumber } = useJudging();
  const [submitted, setSubmitted] = useState(false);
  const [assignedNumber, setAssignedNumber] = useState(0);
  const [assignedName, setAssignedName] = useState('');


  const handleRegister = async (data: { teamName: string; projectName: string; description: string; members: string[] }) => {
    try {
      const team = await registerTeam({ ...data, photoUrl: '' });
      setAssignedNumber(team.teamNumber);
      setAssignedName(data.teamName);
      setSubmitted(true);
      toast.success(`Team "${data.teamName}" registered successfully!`);
    } catch {
      toast.error('Registration failed. Please try again.');
    }
  };

  // Locked state
  if (teamSubmissionsLocked) {
    return (
      <div className="min-h-svh bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <MicrosoftLogo size={40} />
            <h1 className="mt-4 text-2xl font-bold text-foreground">Registration Closed</h1>
            {!shouldRenumber && <p className="mt-2 text-sm text-muted-foreground">Team submissions have been locked. {teams.length} teams registered.</p>}
          </motion.div>
          <InstructionsPanel />
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-svh bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
              <CheckCircle className="mx-auto h-14 w-14 text-primary" />
              <h1 className="mt-4 text-3xl font-bold text-foreground">{assignedName}</h1>
              <p className="mt-2 text-sm text-muted-foreground">You're registered! Good luck in the competition.</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/leaderboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  🏆 View Leaderboard
                </Link>
                <Link to="/rules" className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">
                  📋 Competition Rules
                </Link>
              </div>
            </div>
          </motion.div>
          <InstructionsPanel />
        </div>
      </div>
    );
  }

  // Main registration view — two-column on desktop
  return (
    <div className="min-h-svh bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <MicrosoftLogo size={28} />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Agent-a-Thon</h1>
              <p className="text-[11px] text-muted-foreground">Build AI Agents in Copilot Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/leaderboard" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/80 transition-colors">
              🏆 Leaderboard
            </a>
            {!shouldRenumber && (
              <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium tabular-nums">{teams.length}</span> teams
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
          className="grid gap-8 lg:grid-cols-[1fr_420px]"
        >
          {/* Left: Guide */}
          <div className="order-2 lg:order-1">
            <InstructionsPanel />
          </div>

          {/* Right: Registration form */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
            <RegistrationForm onSubmit={handleRegister} teamsCount={teams.length} hideTeamCount={shouldRenumber} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
