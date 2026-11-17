# Agent-a-Thon Event Hub (portfolio demo)

The event hub built for a 130-attendee Microsoft Copilot Studio agent-building competition at the NSBE 2026 Annual Convention. It covered team sign-up, the lab guide, judge scoring and a live leaderboard, and attendees rated it 4.88 out of 5.

> **This repository uses sample data only.** Every team, judge, score and attendee is made up (emails use `example.com`). No real attendee data, passwords or access codes are included.

## Features

- **Team sign-up** – teams register their name, project and members.
- **Lab guide and lab access help** – step-by-step build instructions and troubleshooting.
- **Judge scoring** – a 100-point rubric across 6 categories, judge pairs in the primary round and a 2-minute timer.
- **Live leaderboard** – primary and final tabs, average-score ranking with tie-breakers; the top 4 teams advance to the final.
- **Winner announcement** – a podium reveal screen for the awards.
- **Admin tools** – judge assignments, round control and CSV exports (spreadsheet formulas are neutralized).
- **Staff check-in** and an **event photo gallery**.

## Demo mode

The judge and admin screens open with a **Demo mode** button, no sign-in needed. The database is read-only for visitors, so any screen that would save shows: *Demo, changes are not saved.*

## Built with

Built with [Lovable](https://lovable.dev) using React, TypeScript, Vite, Tailwind CSS and shadcn/ui, with a hosted Postgres database for teams, scores and the leaderboard.

## Run it locally

Requirements: Node.js 18+ and npm (or Bun).

```sh
git clone <your-fork-url>
cd <repo-folder>
npm install
npm run dev
```

Open http://localhost:8080. The app reads its database URL and public key from `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). To use your own backend, point those at your own project and load the tables with your own sample data.

Run the tests with `npx vitest run`.

## License

Add a license of your choice before publishing.
