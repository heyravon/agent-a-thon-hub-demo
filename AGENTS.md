# Architecture rules
- The event archive provider exposes only read operations and official-round results; no identity restoration, mutations, or automated cleanup, to preserve event records.
- Browser roles receive SELECT only on public archive tables and no attendee privileges; photo policies deny all browser writes, so hidden controls are not the security boundary.
- All app writes go through demo no-ops in the judging context (and direct writes in check-in/gallery show the demo note), because the public demo database is read-only for browsers.
- CSV exports build cells with the shared formula-neutralizing helper, since exported team text is user-controlled.
