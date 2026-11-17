

# Polished homepage redesign

Transform the current minimal card list into a premium, event-branded landing page that feels like a real product launch — while keeping all existing navigation intact.

## What you'll see

**1. Hero section (above the fold)**
- Animated Microsoft 4-square logo + "NSBE Annual Convention 2026" eyebrow chip
- Large display headline: "Agent-a-Thon" with a subtle gradient/shine effect on a key word
- Tagline: "Build AI Agents in Copilot Studio"
- Two primary CTAs side-by-side: **Register Your Team** (filled blue) and **View Leaderboard** (outline)
- Event meta row with icons: 📅 March 21, 2026 · 🕘 9 AM – 4 PM EST · 📍 Renaissance Baltimore Harborplace
- Soft animated background: subtle Microsoft-color gradient blobs / grid pattern (low opacity, no distraction)

**2. Live event stats strip**
Real numbers pulled from the database, animated count-up:
- **186** Teams Registered
- **46 / 130** Attendees Checked In
- **Top 4** Teams Advance to Finals
- **$$$** in Prizes (placeholder you can edit)

**3. "Everything you need" quick-access grid**
A 2×3 card grid replacing today's vertical button list. Each card has an icon, title, one-line description, and hover lift:
- Register Your Team
- Leaderboard & Scores
- Competition Rules
- Lab Guide (PDF)
- Event Gallery (new — links to /gallery)
- Feedback & Raffle (external)

**4. Schedule timeline (compact)**
Horizontal timeline with 4 milestones: Check-in → Build → Judging → Finals & Awards. Each with time and one-line description.

**5. Footer**
Powered-by row (Microsoft Copilot Studio + NSBE), small print, link to /admin and /staff hidden behind a discreet "Staff" link.

## Visual direction

- Keep the Microsoft corporate aesthetic already in the memory: Segoe UI, official MS color palette, clean cards
- Add depth via: soft shadows, subtle gradient accents (blue → cyan), generous whitespace, balanced typography
- Framer Motion: staggered fade-in on load, count-up animation on stats, hover lift on cards
- Fully responsive: 1-column mobile, 2-column tablet, 3-column desktop for the action grid
- Light mode only (matches existing app); respects all existing design tokens in `index.css`

## Technical details

- **Edit `src/pages/Index.tsx`** — replace contents with new sections, reusing existing `Button`, `Card`, `MicrosoftLogo`, lucide icons, and framer-motion (already installed)
- **New small component `src/components/StatCounter.tsx`** — animated count-up using framer-motion's `useMotionValue` + `animate`
- **Stats data source**: client-side query via `supabase.from('teams').select('*', { count: 'exact', head: true })` and same for `attendees` (filtered by `checked_in`); cached via existing `@tanstack/react-query` `QueryClient`
- No new dependencies, no DB changes, no route changes — `FloatingNav` stays as the global nav
- Prize amount and schedule times will be hard-coded constants at the top of the file so you can tweak in seconds (tell me the numbers if you want them filled in now, otherwise I'll use sensible placeholders)

