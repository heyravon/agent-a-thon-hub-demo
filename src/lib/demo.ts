import { toast } from 'sonner';
import type { Judge } from '@/types/judging';

export const DEMO_NOTICE = 'Demo, changes are not saved.';

/** Fictional judge used by the Demo mode button. Matches the sample data. */
export const DEMO_JUDGE: Judge = { name: 'Dana Example', email: 'dana.judge@example.com' };

/** Show the demo note instead of writing to the database. */
export function demoNotice() {
  toast.info(DEMO_NOTICE);
}

/** Neutralize spreadsheet formulas and quote a CSV cell. */
export function csvCell(value: unknown): string {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
