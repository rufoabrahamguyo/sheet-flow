# API Reference

Base URL: `http://localhost:3001` (or your `PORT`). All JSON responses use `Content-Type: application/json`.

---

## Documents

### GET `/api/documents/:id`

Returns the document with the given id. If it does not exist, a default document is created, persisted, and returned.

**Response**

```json
{
  "document": {
    "id": "string",
    "name": "string (optional)",
    "sheets": [
      {
        "id": "string",
        "name": "string",
        "cells": {
          "<row>,<col>": { "value": "string", "format": { "bold": true, "italic": false } }
        }
      }
    ],
    "activeSheetId": "string"
  }
}
```

---

### PUT `/api/documents/:id`

Creates or overwrites the document. URL `id` and `document.id` must match.

**Request body**

```json
{
  "document": {
    "id": "string",
    "name": "string (optional)",
    "sheets": [
      {
        "id": "string",
        "name": "string",
        "cells": { "<row>,<col>": { "value": "string", "format": { "bold": false, "italic": false } } }
      }
    ],
    "activeSheetId": "string"
  }
}
```

**Response**

```json
{ "ok": true }
```

**Validation**

- `document` must be an object with `id`, `sheets` (array), and `activeSheetId`.

---

## Chat

### POST `/api/chat`

Sends the conversation history and returns the next assistant message.

**Request body**

```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "What can you do?" }
  ]
}
```

- `messages`: array of `{ role: "user" | "assistant", content: string }`.

**Response**

```json
{
  "message": {
    "role": "assistant",
    "content": "string"
  }
}
```

If `OPENAI_API_KEY` is set, the backend uses OpenAI; otherwise it returns a stub response.

---

## Upload

### POST `/api/upload`

Accepts either:

1. **Multipart form (file)**  
   - Field name: `file`.  
   - Optional form field: `scanHandwriting` (e.g. `"true"`).  
   - Response: `{ "success": true, "data": { "text": "...", "extracted": "..." } }`.

2. **JSON (paste)**  
   - Body: `{ "text": "string", "scanHandwriting": boolean }`.  
   - Response: `{ "success": true, "data": { "text": "...", "extracted": "..." } }` when `scanHandwriting` is true, else `{ "success": true, "data": { "text": "..." } }`.

**Errors**

- 400: Missing both file and JSON `text` (or invalid body).

---

## Errors

Error responses use HTTP status codes and a JSON body:

```json
{ "message": "Human-readable error description" }
```

Common statuses: `400` (validation), `500` (server error).
