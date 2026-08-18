# Turso database

This version uses a persistent Turso-hosted SQL database instead of a local `sql.js` file.

Required server environment variables:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

The credentials are intentionally not included in this project.
The schema and demo seed data are created automatically on first startup.
