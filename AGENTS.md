# Project instructions

This repository contains the EligibalME web app, PostgreSQL account API, and optional scheme retrieval API. Treat application code as user-owned, keep changes focused, and preserve existing conventions.

## Key areas

- `src/`: React frontend and bundled scheme catalogue.
- `server/`: Express API, PostgreSQL schema, authentication, application tracker, and Telegram integration.
- `recommendation_api/`: optional FastAPI scheme retrieval and discovery service.

## Local development

- Read `README.md` for setup, environment variables, and local run instructions.
- Use `npm run dev` for the frontend and run the APIs separately when needed.
- Never commit local environment files or credentials.
- Run the relevant lint, build, and test commands before finishing code changes.
