import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLogo } from '@/components/AppLogo';
import { StatCounter } from '@/components/StatCounter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Trophy,
  BookOpen,
  FlaskConical,
  MessageSquareHeart,
  Image as ImageIcon,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  Hammer,
  Gavel,
  Award,
  ArrowRight,
} from 'lucide-react';

// === EDITABLE EVENT CONSTANTS ===
const EVENT_DATE = 'Saturday, March 21, 2026';
const EVENT_TIME = '9:00 AM – 4:00 PM EST';
const EVENT_VENUE = 'Renaissance Baltimore Harborplace';
const GRAND_PRIZE = 'Laptops';
// Only count teams that participated on event day (March 21, 2026 EST)
const EVENT_DAY_START = '2026-03-21T00:00:00-05:00';
const EVENT_DAY_END = '2026-03-22T00:00:00-05:00';

const SCHEDULE = [
  { time: '9:00 AM', label: 'Check-In & Welcome', icon: CheckCircle2, color: 'ms-blue' },
  { time: '10:00 AM', label: 'Build & Iterate', icon: Hammer, color: 'ms-green' },
  { time: '1:30 PM', label: 'Judging Rounds', icon: Gavel, color: 'ms-yellow' },
  { time: '3:30 PM', label: 'Finals & Awards', icon: Award, color: 'ms-orange' },
];

const ACTIONS = [
  {
    to: '/register',
    label: 'Register Your Team',
    desc: 'Submit your team and project details',
    icon: Users,
    accent: 'ms-blue',
  },
  {
    to: '/leaderboard',
    label: 'Leaderboard',
    desc: 'Live scores and team rankings',
    icon: Trophy,
    accent: 'ms-yellow',
  },
  {
    to: '/rules',
    label: 'Competition Rules',
    desc: 'Format, judging rubric, and guidelines',
    icon: BookOpen,
    accent: 'ms-green',
  },
  {
    to: '/lab-guide',
    label: 'Lab Guide',
    desc: 'Step-by-step Copilot Studio walkthrough',
    icon: FlaskConical,
    accent: 'ms-orange',
  },
  {
    to: '/gallery',
    label: 'Event Gallery',
    desc: 'Photos from the convention floor',
    icon: ImageIcon,
    accent: 'ms-blue',
  },
  {
    to: 'https://victorious-coast-09e35ae0f.1.azurestaticapps.net/',
    label: 'Feedback & Raffle',
    desc: 'Share feedback, enter to win prizes',
    icon: MessageSquareHeart,
    accent: 'ms-red',
    external: true,
  },
];

function useStats() {
  const teams = useQuery({
    queryKey: ['index-team-count', EVENT_DAY_START],
    queryFn: async () => {
      const { count } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', EVENT_DAY_START)
        .lt('submitted_at', EVENT_DAY_END);
      return count ?? 0;
    },
  });
  return { teamCount: teams.data ?? 0 };
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Index() {
  const { teamCount } = useStats();

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {/* Soft branded background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-ms-blue/10 blur-3xl" />
        <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-ms-green/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-ms-yellow/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
        {/* HERO */}
        <motion.section
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="text-center"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-ms-blue" />
            NSBE Annual Convention 2026
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-6 flex justify-center"
          >
            <AppLogo size={56} />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            Agent
            <span
              className="bg-gradient-to-r from-ms-blue via-ms-blue to-cyan-400 bg-clip-text text-transparent"
            >
              -a-
            </span>
            Thon
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg"
          >
            Build production-ready AI Agents in Microsoft Copilot Studio. Compete, learn, and ship in
            a single day.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/register">
              <Button size="lg" className="h-12 gap-2 px-7 text-base font-semibold shadow-md">
                <Users className="h-5 w-5" />
                Register Your Team
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 px-7 text-base font-semibold"
              >
                <Trophy className="h-5 w-5" />
                View Leaderboard
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-ms-blue" />
              {EVENT_DATE}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-ms-green" />
              {EVENT_TIME}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-ms-red" />
              {EVENT_VENUE}
            </span>
          </motion.div>
        </motion.section>

        {/* STATS STRIP */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-16"
        >
          <Card className="grid grid-cols-2 divide-y divide-border border-border/60 bg-card/80 p-0 shadow-sm backdrop-blur md:grid-cols-4 md:divide-x md:divide-y-0">
            <StatBlock
              label="Teams Registered"
              value={<StatCounter to={teamCount} />}
              accent="ms-blue"
            />
            <StatBlock
              label="Scoring Categories"
              value={<StatCounter to={6} />}
              accent="ms-green"
            />
            <StatBlock
              label="Advance to Finals"
              value={<>Top <StatCounter to={4} /></>}
              accent="ms-yellow"
            />
            <StatBlock label="Grand Prize" value={GRAND_PRIZE} accent="ms-orange" />
          </Card>
        </motion.section>

        {/* QUICK ACTIONS */}
        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="ui-label">Quick access</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Everything you need
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACTIONS.map((a, i) => (
              <motion.div
                key={a.to}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <ActionCard {...a} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* SCHEDULE */}
        <section className="mt-20">
          <div className="mb-8">
            <p className="ui-label">Day-of timeline</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              The schedule
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-4">
              {SCHEDULE.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-background shadow-sm border-${s.color}`}
                  >
                    <s.icon className={`h-5 w-5 text-${s.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tabular-nums text-foreground">{s.time}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-24 border-t border-border pt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AppLogo size={14} />
            <span>Demo with sample data. Created by HeyRavon.ai.</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>© 2026 Agent-a-Thon</span>
            <span aria-hidden>·</span>
            <Link to="/staff" className="transition-colors hover:text-foreground">
              Staff
            </Link>
            <span aria-hidden>·</span>
            <Link to="/admin" className="transition-colors hover:text-foreground">
              Admin
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center px-4 py-6 text-center">
      <span className={`absolute left-1/2 top-0 h-0.5 w-10 -translate-x-1/2 rounded-full bg-${accent}`} />
      <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function ActionCard({
  to,
  label,
  desc,
  icon: Icon,
  accent,
  external,
}: {
  to: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  external?: boolean;
}) {
  const inner = (
    <Card className="group relative h-full overflow-hidden border-border/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 bg-${accent} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${accent}/10 text-${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Card>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="block h-full">
        {inner}
      </a>
    );
  }
  return (
    <Link to={to} className="block h-full">
      {inner}
    </Link>
  );
}
