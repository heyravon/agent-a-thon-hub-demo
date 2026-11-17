# Architecture rules
- The event archive provider exposes only read operations and official-round results; no identity restoration, mutations, or automated cleanup, to preserve event records.
- Browser roles receive SELECT only on public archive tables and no attendee privileges; photo policies deny all browser writes, so hidden controls are not the security boundary.
