# LearnTwin AI

LearnTwin is a personalized learning app with a React/Vite frontend and a FastAPI backend.

## Requirements

- Python 3.10+
- Node.js 18+

## Run locally

Start the backend from the project root:

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

In another terminal, start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The Vite development server forwards `/api` requests to the backend at `http://localhost:8000`. Interactive API documentation is available at http://localhost:8000/docs.

## Deploy to Vercel

In Vercel Project Settings → Build and Deployment, set the Root Directory to the repository root (`.`), not `frontend`. The root `vercel.json` builds the Vite app from `frontend/` and routes `/api/*` requests to the FastAPI function in `api/index.py`.

Set `LEARNTWIN_SECRET_KEY` in the Vercel project's Environment Variables for Production, Preview, and Development. Generate a strong value with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Then redeploy. Vercel uses a temporary filesystem for demo state, so data changes may reset when a serverless instance restarts.

## Authentication secret

For local demos, the backend generates a random JWT signing key when `LEARNTWIN_SECRET_KEY` is not set. This invalidates existing login tokens whenever the backend restarts. Set `LEARNTWIN_SECRET_KEY` to a persistent, securely generated value when running the backend in a persistent environment.

## Local data

The backend creates `backend/db.json` for runtime state. It is intentionally ignored by Git; `backend/seed_data.json` provides the initial demo state.
