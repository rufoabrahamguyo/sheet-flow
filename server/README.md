# Sheet Flow – Backend

Express + TypeScript API for Sheet Flow: document/sheet persistence, AI chat, and file/text upload.

## Installation

```bash
npm install
```

## Environment

Copy `.env.example` to `.env` and adjust:

| Variable          | Description |
|-------------------|-------------|
| `PORT`            | Server port (default: 3001). |
| `CORS_ORIGIN`     | Allowed frontend origin (e.g. `http://localhost:5173`). |
| `MONGODB_URI`     | MongoDB connection string (e.g. `mongodb://127.0.0.1:27017`). |
| `MONGODB_DB`      | MongoDB database name (default: `sheetflow`). |
| `JWT_SECRET`      | Required. Secret used to sign access tokens. |
| `GEMINI_API_KEY`  | Optional. Google Gemini API key for AI chat (preferred). Get one at [Google AI Studio](https://aistudio.google.com/apikey). |
| `OPENAI_API_KEY`  | Optional. OpenAI API key for AI chat if Gemini is not set; stub used when neither is set. |

## Running

**Development (with watch)**

```bash
npm run dev
```

**Production**

```bash
npm run build
npm start
```

## Testing

```bash
npm test
```

Server listens on `http://localhost:3001` (or the port from `PORT`).

## API overview

See [API.md](API.md) for request/response shapes and validation.

| Method | Path                    | Description |
|--------|-------------------------|-------------|
| GET    | `/api/documents/:id`    | Get document by id (creates default if missing). |
| PUT    | `/api/documents/:id`    | Create or update document. |
| POST   | `/api/chat`             | Send conversation and get AI reply. |
| POST   | `/api/upload`           | Upload file (multipart) or paste text (JSON). |

## Database

MongoDB is used. Set `MONGODB_URI` (e.g. `mongodb://127.0.0.1:27017`) and optionally `MONGODB_DB` (default: `sheetflow`). On startup the server creates the database and `users` / `documents` collections and indexes. In MongoDB Compass or `mongosh`, look for the database named **sheetflow** (or the value of `MONGODB_DB`). Ensure MongoDB is running and `JWT_SECRET` is set in `.env` so registration and login work.
