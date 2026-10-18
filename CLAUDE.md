# Writing Sophia frontend

Full context for both repos, covering architecture, data, auth, comments, deploy
and how this user works, lives in the backend repo:
`../writing-sophia-backend/CLAUDE.md`. Read it first.

The short version: React + Vite on GitHub Pages (a push to `main` deploys it).
The public pages read only the public GCS bucket. The Studio and the signed-in
comment features call the FastAPI backend with a Neon Auth JWT. Keep the auth SDK
lazy-loaded so it stays out of the main bundle.
