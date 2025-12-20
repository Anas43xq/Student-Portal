# Student Portal

This repository contains the Student Portal frontend (React) and backend (Node.js).

## Frontend (deployed)
- The frontend is built in `frontend/` and the production build is placed in `frontend/build`.
- The frontend `package.json` includes a `homepage` field configured for GitHub Pages.

## Deployment (GitHub Pages)
- A GitHub Actions workflow is included at `.github/workflows/deploy.yml` that builds and deploys the frontend to the `gh-pages` branch on each push to `main`.
- The site will be published at the URL configured in `frontend/package.json` `homepage` field: `https://Anas43xq.github.io/Student-Portal`.

## Local build
- To build locally:
  - cd frontend
  - npm install
  - npm run build

## Environment variables & secrets 🔐
- The backend reads configuration from environment variables (see `backend/.env.example`).
- **Do not commit real secrets** (DB passwords, API keys, JWT secret) to the repository. `backend/Configurations.env` is a local env file and is now ignored by git.
- Add `JWT_SECRET` to your environment (recommended) or set it in a local `Configurations.env` for development. If you've previously committed secrets, rotate them immediately.

