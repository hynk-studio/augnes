# Screenshot Capture Guide

Real screenshots were not generated in this branch because browser automation was not available in the current coding session. Do not add fake screenshots.

To capture final demo screenshots:

1. Run the app:

   ```bash
   npm install
   cp .env.example .env.local
   npm run db:reset
   npm run demo:seed
   npm run dev -- --port 3000
   ```

2. Open `http://localhost:3000`.
3. Capture these views:

   - `01-chat-cockpit.png`: Chat Cockpit with the canonical demo message.
   - `02-pending-proposals.png`: multiple pending Temporal Delta Proposal cards.
   - `03-snapshot-trajectory.png`: State Snapshot and State Trajectory View after commits.
   - `04-tensions.png`: Tensions panel showing open temporal/runtime concerns.
   - `05-state-grounded-actions.png`: planner recommendations and README Checklist tool run.
   - `06-state-brief-json.png`: `/api/state/brief?scope=project:augnes` response showing `runtime`, `as_of`, state groups, tensions, and agent instructions.

4. Keep generated screenshots under `screenshots/`.
