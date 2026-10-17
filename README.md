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
