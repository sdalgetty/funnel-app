# Universal Import: ChatGPT GPT + Validation API

This doc describes how to connect the universal import sheet to a **Custom GPT** in ChatGPT that guides users and, via a **validation API**, checks their CSV so the app won’t throw errors when they import. Goal: fewer back-and-forth steps for the user.

---

## Overview

| Piece | Purpose |
|-------|--------|
| **Custom GPT** | Guides the user through the sheet structure, answers questions, and can send their CSV to a validation API. |
| **Validation API** | Accepts CSV (or equivalent), runs the same rules the app’s importer will use, returns errors/warnings and a summary. No import—validation only. |
| **User flow** | User fills sheet → uploads/pastes CSV in ChatGPT → GPT calls API → user gets clear feedback and fixes until validation passes → user imports in the app. |

---

## 1. Custom GPT design

### Role and instructions (high level)

- You are a **guide for pasting historical leads and bookings** into the app’s universal import sheet (one Google Sheet / CSV).
- You explain:
  - The **one table, one row per lead** model: Date Inquired + Project Name required; Booked Date + Booked Revenue only when they actually booked.
  - **Column meanings and formats** (dates, dollars, optional vs required) per `docs/universal-import-sheet.md`.
  - How to **create the sheet** (from template CSV or from scratch with the exact header row).
- When the user has a CSV:
  - You can **call the validation API** (see below) with the CSV content.
  - You translate the API response into **plain language**: what’s wrong, which rows, and how to fix it.
  - You repeat until validation passes, then tell them they’re ready to import in the app.

### Capabilities to give the GPT

- **File upload**: So the user can upload their CSV (or paste a download link if the API supports URL).
- **Action: Validate CSV** (see API contract below): POST the CSV (or a JSON wrapper) to your validation endpoint; parse the JSON response and explain it.

### Suggested GPT instructions (to paste into the GPT’s “Instructions” field)

You can refine this; the important part is the flow and the reference to the validation action.

```text
You help users prepare their past leads and bookings for import into the app using the "Universal Import Sheet."

## Your role
- Explain the sheet structure: one row per lead; required columns "Date Inquired" and "Project Name"; optional "Booked Date" and "Booked Revenue" for leads that booked.
- Point users to the template or the exact header row (see universal-import-sheet.md).
- When the user provides a CSV (upload or paste), use the "Validate universal import CSV" action to check it.
- Explain validation results in simple terms: which rows have errors, what to fix (e.g. missing Date Inquired, invalid date format, empty Project Name, Booked Date without Booked Revenue).
- Keep guiding until validation passes, then confirm they can import the CSV in the app.

## Rules
- Never create or modify the user’s CSV yourself; only advise.
- For validation, always use the validation API with the exact CSV content the user provided.
- If the API is unavailable, tell the user to check their CSV against the column rules in the docs and try importing in the app.
```

---

## 2. Validation API contract

The app (or a small backend you host) exposes a **validation-only** endpoint. It does **not** write to the database; it only parses the CSV and returns errors/warnings using the same rules the future universal importer will use.

### Endpoint

- **Method**: `POST`
- **Path**: e.g. `/api/validate-universal-import` or `https://your-api.com/validate-universal-import`
- **Auth**: Optional but recommended (e.g. API key in header or Bearer token) so only your app or GPT can call it. If you don’t need to restrict callers, you can leave it open.

### Request

**Option A – JSON body (good for GPT / serverless)**

```json
{
  "csv": "Date Inquired,Project Name,...\n2024-01-15,Smith Wedding,..."
}
```

- **Content-Type**: `application/json`
- **Body**: `{ "csv": "<raw CSV string>" }`

**Option B – Form data (if user uploads file to your backend)**

- **Content-Type**: `multipart/form-data`
- **Field**: `file` (the CSV file)

For the GPT flow, Option A is usually easier: the GPT sends the CSV string in JSON.

### Response (JSON)

Use a single shape so the GPT can parse it reliably.

```json
{
  "ok": false,
  "errors": [
    { "row": 2, "field": "Date Inquired", "message": "Missing or invalid date" },
    { "row": 4, "field": "Project Name", "message": "Required; empty" },
    { "row": 5, "field": "Booked Revenue", "message": "Booked Date is set but Booked Revenue is missing or not a number" }
  ],
  "warnings": [
    { "row": 3, "message": "Lead Source and Service Type are empty; app will use defaults" }
  ],
  "summary": {
    "totalRows": 10,
    "validRows": 7,
    "inquiryCount": 7,
    "bookingCount": 3
  }
}
```

- **`ok`**: `true` if there are no **errors** (warnings are allowed when `ok` is true).
- **`errors`**: List of issues that would cause the app import to fail or skip rows. Each item has `row` (1-based, so row 1 = header), optional `field`, and `message`.
- **`warnings`**: Issues that won’t block import but the user might want to fix (e.g. defaults used, duplicate project+date).
- **`summary`**: So the GPT can say e.g. “You have 10 rows; 7 are valid. This will add 7 inquiries and 3 bookings.”

### Validation rules (match the app’s future importer)

- **Header row**: Must include columns that map to “Date Inquired” and “Project Name” (allow common aliases, e.g. “Inquiry Date”, “Project”).
- **Per row**:
  - **Date Inquired**: Required; must parse to a valid date (YYYY-MM-DD, MM/DD/YYYY, etc.).
  - **Project Name**: Required; non-empty after trim.
  - **Booked Date**: Optional; if present, must be a valid date.
  - **Booked Revenue**: If **Booked Date** is present, **Booked Revenue** must be present and parseable as a positive number (dollars or with $, commas).
  - Duplicates: Same **Project Name** + **Booked Date** in multiple rows → warning (duplicate booking).
- **Encoding**: Accept UTF-8. Reject or warn on invalid characters if needed.

Return one error per row/field so the GPT can say “Row 4: fix Date Inquired.”

---

## 3. How ChatGPT connects to the API (OpenAI Actions)

Custom GPTs can call your API via **Actions** (OpenAI’s schema for “tools” that call URLs).

1. In the GPT editor: **Configure → Actions → Create new action**.
2. **Authentication**: If your API uses an API key, choose “API Key” and add the key (e.g. in a header). Otherwise “No auth” for an open endpoint.
3. **Schema** (OpenAPI 3.0): You describe the validation endpoint. Example:

```yaml
openapi: 3.0.0
info:
  title: Universal Import Validation API
  version: 1.0.0
paths:
  /validate-universal-import:
    post:
      summary: Validate universal import CSV
      operationId: validateUniversalImportCsv
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [csv]
              properties:
                csv:
                  type: string
                  description: Raw CSV file content (header row + data rows)
      responses:
        '200':
          description: Validation result
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok: { type: boolean }
                  errors: {
                    type: array
                    items:
                      type: object
                      properties:
                        row: { type: integer }
                        field: { type: string }
                        message: { type: string }
                  }
                  warnings: {
                    type: array
                    items:
                      type: object
                      properties:
                        row: { type: integer }
                        message: { type: string }
                  }
                  summary:
                    type: object
                    properties:
                      totalRows: { type: integer }
                      validRows: { type: integer }
                      inquiryCount: { type: integer }
                      bookingCount: { type: integer }
```

4. **Server URL**: Your validation API base URL (e.g. `https://api.yourapp.com` or a Netlify/Supabase function URL).

After you deploy the real validation endpoint, paste its URL and (if needed) the auth into the action. The GPT will then be able to call it when the user uploads or pastes a CSV.

---

## 4. Where to implement the validation API

You have a Vite SPA and Supabase; there’s no in-repo API server. Two practical options:

| Option | Pros | Cons |
|-------|------|------|
| **Netlify Function** | Same place as frontend; easy env vars | Need to add `netlify/functions` and the handler |
| **Supabase Edge Function** | Same auth/backend as app; can reuse types | Separate deploy; need to expose a public or key-protected URL |

**Suggested**: A **Netlify Function** (e.g. `netlify/functions/validate-universal-import.ts`) that:

1. Parses `POST` body: `JSON.parse(body).csv`.
2. Runs the same parsing/validation logic you’ll use in the app’s universal importer (shared validation module or port of the rules).
3. Returns the JSON response above.

That way, when you build the in-app universal importer later, you can reuse the same validation logic and keep behavior in sync.

---

## 5. User flow (end-to-end)

1. User opens the Custom GPT (e.g. “Funnel app import helper”).
2. User says they want to import past leads. GPT explains the sheet and points to the template/docs.
3. User creates the sheet (from template or from scratch), fills it, and exports CSV.
4. User uploads the CSV in the chat (or pastes content).
5. GPT calls the validation API with the CSV string.
6. API returns `{ ok, errors, warnings, summary }`.
7. GPT explains: “Validation found 2 errors: Row 4 – missing Date Inquired; Row 7 – Booked Date is set but Booked Revenue is empty. Fix those and re-upload.”
8. User fixes and re-uploads; repeat until `ok: true`.
9. GPT says: “Your CSV is valid. You’ll get 12 inquiries and 5 bookings. Import it in the app via [Import → Universal / Google Sheet].”

No app code runs until the user actually imports in the app; the API only validates, so there’s no back-and-forth with the app throwing errors.

---

## 6. Summary

- **GPT**: Guide + file upload + call to validation API; explain results in plain language until validation passes.
- **Validation API**: POST CSV in JSON; respond with `ok`, `errors`, `warnings`, `summary`; use the same rules the app importer will use.
- **OpenAI Action**: Describe the validation endpoint in OpenAPI and point the GPT at your deployed URL (and auth if you use it).
- **Implementation**: Add a validation-only endpoint (e.g. Netlify Function) and a shared validation module so the future in-app importer stays in sync.

Once this is in place, users get guided filling and pre-validated CSVs, and the app only needs to run the actual import when they’re ready.
