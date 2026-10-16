# Room Finder Nepal — Roommate Matching Upgrade

This build adds a roommate-matching area alongside the existing room-finding experience.

## Included

- Roommate profile creation/editing (city, area, budget, move-in date, room type, and living preferences).
- Swipe-style discovery with pass/interest actions.
- Compatibility explanation and a heuristic compatibility score.
- Mutual-like matching persisted in the database.
- In-platform messages for mutual matches (the conversation refreshes periodically while open).
- Self-organized meetup invitations: choose a place, date, and time; the other person accepts or declines.
- Available room suggestions on match cards using the combined maximum budget and area/city.
- Report and block actions for profile safety.
- Responsive CSS for mobile and desktop.
- New database tables are created automatically by the existing database initialization on server startup.

## Run locally

1. Configure the same environment variables required by the existing application (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `SESSION_SECRET` for production).
2. Install dependencies with `npm install`.
3. Run `npm run dev`.
4. Sign in or register, open **Roommates**, and publish a roommate profile.
5. Use a second account to create another profile and test mutual interest, chat, and meetup invitations.

## Notes

- The compatibility score is a transparent heuristic, not a guarantee of compatibility or safety.
- A meetup is only confirmed after the recipient accepts it. Users organize their own physical meeting; Room Finder does not reserve venues.
- First meetings should be arranged in public places. Users can block or report profiles.
- Report submissions are stored in the database for review; a dedicated admin report-review screen is not included in this upgrade.
- Room recommendations are suggestions based on current available listings, the other profile's area/city, and the combined maximum budget. Users should confirm rent, occupancy permission, deposit, and utility costs with the owner.
- The existing application dependencies could not be installed in this execution environment, so a full Vite production build and live database integration test could not be completed here. TypeScript syntax diagnostics were checked, but the project should be built and tested after dependencies are installed.
