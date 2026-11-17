import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Trophy, BookOpen, FlaskConical, MessageSquareHeart, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/register', label: 'Register', icon: Users },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/rules', label: 'Rules', icon: BookOpen },
  { to: '/lab-guide', label: 'Lab Guide', icon: FlaskConical },
  { to: 'https://victorious-coast-09e35ae0f.1.azurestaticapps.net/', label: 'Feedback & Raffle', icon: MessageSquareHeart, external: true },
];

export function FloatingNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mb-2 flex flex-col gap-1.5 rounded-xl border border-border bg-card p-2 shadow-lg"
          >
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.to;
              const className = `flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              }`;
              return item.external ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(o => !o)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>
  );
}
