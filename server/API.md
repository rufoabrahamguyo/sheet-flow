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

## Document intelligence (receipt scanning)

### POST `/api/extract/receipt`

Upload a receipt or invoice image (JPEG, PNG, WebP). The AI extracts structured data.

**Request:** `multipart/form-data` with field `file` (image).

**Response**

```json
{
  "success": true,
  "result": {
    "date": "YYYY-MM-DD or string",
    "supplier": "string",
    "total": number | null,
    "currency": "string | null",
    "lineItems": [
      { "itemName": "string", "quantity": number, "unitPrice": number, "amount": number, "category": "string" }
    ]
  }
}
```

Requires `GEMINI_API_KEY`. 400 if no file or wrong type; 422 if image could not be parsed.

---

## M-Pesa analysis

### POST `/api/mpesa/analyze`

Upload an M-Pesa statement file or send pasted text. Returns parsed transactions, summary totals, and an AI-generated insight.

**Request:** Either

1. **Multipart:** field `file` (text/CSV file), or  
2. **JSON:** `{ "text": "pasted statement text" }`.

**Response**

```json
{
  "success": true,
  "transactions": [
    { "date": "string", "description": "string", "amount": number, "type": "credit" | "debit" }
  ],
  "summary": {
    "totalRevenue": number,
    "totalExpenses": number,
    "netProfit": number,
    "transactionCount": number
  },
  "insight": "One-sentence summary, e.g. Your business received KES 145,000 in sales this month through M-Pesa."
}
```

---

## Business report

### POST `/api/report/generate`

Generates a financial summary and business insights from the current spreadsheet data.

**Request body**

```json
{ "documentId": "string" }
```

**Response**

```json
{
  "success": true,
  "financialSummary": { "monthlyRevenue": number | null, "monthlyExpenses": number | null, "profitLoss": number | null, "currency": "string" } | null,
  "insights": ["string", "..."],
  "narrative": "One paragraph with notable finding."
}
```

Uses the document owned by the current user (or anonymous). 404 if document not found.

---

## Errors

Error responses use HTTP status codes and a JSON body:

```json
{ "message": "Human-readable error description" }
```

Common statuses: `400` (validation), `500` (server error).
