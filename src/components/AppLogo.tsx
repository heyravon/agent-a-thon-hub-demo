import { Bot } from 'lucide-react';

/** Neutral app mark used in place of any vendor logo. */
export function AppLogo({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Bot style={{ width: size * 0.62, height: size * 0.62 }} />
    </span>
  );
}
