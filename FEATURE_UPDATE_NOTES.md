# Owner onboarding and loading-state update

- Existing signed-in renters can use **Continue as Owner** from My Account. It upgrades the existing account in place; no duplicate account is created.
- Owner accounts can still explore rooms and open My Account to access saved favorites and renter inquiries.
- Added an authenticated, CSRF-protected `/api/auth/become-owner` endpoint. Admin accounts cannot be converted.
- Added initial/search/reset room-loading skeletons, a loading indicator, a distinct empty state only after a successful empty response, and an error/retry state when room fetching fails.
- Room publishing continues to use the existing submit/loading behavior in AddRoomModal.

This ZIP contains source changes only. It has not been deployed to Render; build and test in the project environment before pushing to production.
