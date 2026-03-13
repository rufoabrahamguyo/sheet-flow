# Sheet Flow

Full-stack spreadsheet application with React (Vite + TypeScript) frontend and Node.js (Express + TypeScript) backend. Features a multi-sheet grid (columns A–O, 25 rows), formatting toolbar, AI chat sidebar, and upload (file/paste/camera) with optional handwriting scan.

## Prerequisites

- Node.js 18+
- npm or yarn

## Quick Start

### 1. Install dependencies

```bash
# Frontend (project root)
npm install

# Backend
cd server && npm install && cd ..
```

### 2. Environment (optional)

- **Frontend**: Copy `.env.example` to `.env` and set `VITE_API_URL` if the backend is not on the same host (e.g. production). For local dev, the Vite proxy forwards `/api` to the backend.
- **Backend**: Copy `server/.env.example` to `server/.env` and set **`JWT_SECRET`**, `PORT`, `CORS_ORIGIN`, and optionally `OPENAI_API_KEY`, `DATABASE_PATH`. See [server/README.md](server/README.md).

### 3. Run both apps

**Terminal 1 – backend**

```bash
cd server && npm run dev
```

**Terminal 2 – frontend**

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3001  

Data is stored in SQLite under `server/data/` by default.

## Scripts (frontend)

| Command      | Description        |
|-------------|--------------------|
| `npm run dev`    | Start Vite dev server |
| `npm run build`  | Production build   |
| `npm test`       | Run unit tests (Vitest) |
| `npm run preview`| Preview production build |

## Environment variables (frontend)

| Variable        | Description |
|----------------|-------------|
| `VITE_API_URL` | Backend base URL. Leave unset in dev to use the built-in proxy. |

## Documentation

- [Backend setup & API](server/README.md)
- [API endpoints and request/response formats](server/API.md)
