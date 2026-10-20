# Room Photo Upload and Publishing Fix

This update keeps the Agent-First features and improves the new/edit room form and its API validation.

## What changed

- The gallery picker supports selecting multiple photos in one action, up to 10 photos per room.
- Photos are resized/compressed in the browser before submission to reduce mobile-data use and avoid oversized JSON requests.
- Selected photos are previewed before publishing. An owner can remove photos and move them up/down; the first photo is the cover image.
- New listings no longer start with a preselected sample room image, a New York city default, a sample price, or a fake phone number.
- Publishing requires at least one photo. The form shows the API error instead of silently closing or swallowing a failed save.
- The server no longer substitutes a sample Unsplash photo when an upload is empty/invalid; it returns a clear validation error instead.
- Room creation/update still saves the photos array into the existing Turso room record, matching the project's current storage design.

## Important notes

- This project currently stores compressed image data URLs in the Turso `rooms.photos` field. That is compatible with the existing architecture but is not the ideal long-term image-storage design for a large marketplace; object storage plus image URLs would scale better.
- This ZIP does not connect to or modify the live production database and does not remove any old sample listings already stored there.
- The source files passed TypeScript/TSX syntax transpilation checks. A full production build could not be run in this environment because the project dependencies are not installed here.
