import { Link, useLocation } from 'react-router-dom';
import { Users, Trophy, BookOpen, FlaskConical, MessageSquareHeart, Image as ImageIcon, Home } from 'lucide-react';
import { MicrosoftLogo } from '@/components/MicrosoftLogo';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/register', label: 'Register', icon: Users },
  { to: '/leaderboard', label: 'Leaderboard', shortLabel: 'Scores', icon: Trophy },
  { to: '/rules', label: 'Rules', icon: BookOpen },
  { to: '/lab-guide', label: 'Lab Guide', shortLabel: 'Lab', icon: FlaskConical },
  { to: '/gallery', label: 'Gallery', icon: ImageIcon },
  {
    to: 'https://victorious-coast-09e35ae0f.1.azurestaticapps.net/',
    label: 'Feedback',
    icon: MessageSquareHeart,
    external: true,
  },
];

// Routes where the public nav should not appear (staff/judge/admin tools)
const HIDDEN_ROUTES = ['/judge', '/admin', '/staff', '/announce', '/lab-access'];

function ItemLink({
  item,
  active,
  className,
  children,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (item.external) {
    return (
      <a
        href={item.to}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={item.to} className={className} onClick={onClick} aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  );
}

export function SiteNav() {
  const location = useLocation();
  if (HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r))) return null;

  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  return (
    <>
      {/* === Desktop / tablet: sticky top header === */}
      <header className="sticky top-0 z-40 hidden w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <MicrosoftLogo size={22} />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Agent-a-Thon
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.filter((i) => i.to !== '/').map((item) => {
              const active = isActive(item.to);
              return (
                <ItemLink
                  key={item.to}
                  item={item}
                  active={active}
                  className={cn(
                    'relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                  )}
                </ItemLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* === Mobile: bottom tab bar === */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV_ITEMS.filter((i) => !i.external).slice(0, 5).map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.to}>
                <ItemLink
                  item={item}
                  active={active}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <item.icon className={cn('h-5 w-5', active && 'scale-110 transition-transform')} />
                  <span className="leading-none">{item.shortLabel ?? item.label}</span>
                </ItemLink>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Spacer so mobile content isn't hidden behind the bottom bar */}
      <div className="h-16 w-full md:hidden" aria-hidden />
    </>
  );
}
