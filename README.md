<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3fd0a3b4-7ee5-4b68-8ae1-de8cae10aed5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Referral campaign (new)

The referral campaign is disabled by default. An administrator can activate or pause it in **Admin Dashboard → Referrals & Rewards**. Each account receives a personal invite link in its user dashboard. New accounts signed up through that link are placed in a pending review queue; admins must verify legitimate referrals before they count toward badges and the leaderboard. While the campaign is active, the first 100 eligible referrals verified receive reward slots of Rs. 2,500 each. The app records slot allocation; reward payment must be handled and confirmed by the campaign operator. Campaign counts are real database counts, not simulated progress.

Referral schema tables are created automatically on server startup in Turso: `referral_campaign`, `referral_codes`, and `referrals`. No extra environment variables are required.


## Campaign sharing and Google sign-in

The public sharing campaign is available at `/spread`. It records share actions separately from distinct campaign-link visitors. Guest progress is associated with an unshared browser token and can be claimed after signing in; visitor counts are based on a browser token and are not proof of message delivery. The first campaign badge unlocks after a share action.

Google sign-in uses `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. In Google Cloud OAuth client settings, use the production origin `https://landmark-roomfinder.onrender.com` and authorized redirect URI `https://landmark-roomfinder.onrender.com/api/auth/google/callback`. Existing accounts with a matching email are not silently linked; the user must sign in with their existing method first. Google-created accounts receive the standard `user` role.

## Agent-first sharing improvements (October 2026)

- Owners can copy a public catalogue link from the Owner Dashboard (`/?agent=OWNER_ID`). The catalogue groups listings by the owner's existing account ID and shows their listed rooms and status.
- Each room can be opened directly through a shareable URL (`/?room=ROOM_ID`). The app opens that room's details when the page loads.
- Owners can share a ready-made room advertisement from the dashboard. Devices that support the Web Share API open the native share sheet; other devices copy the ad text for pasting into messaging/social apps.
- The public catalogue also provides per-room sharing and a call link when a room contact phone is available.

These features reuse existing room and account data; they do not add a new database schema. Public catalogue contact details are taken from the room listing's existing contact fields. Test the deployed build before promoting it to production.
