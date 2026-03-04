# Universal Import Sheet – Past Sales & Funnel Data

Use **one Google Sheet** to gather all past leads and bookings. Later you’ll use this sheet (exported as CSV) to import into the app for both **Funnel** (inquiries, closes, revenue) and **Sales** (bookings).

This doc is the user-facing spec: spreadsheet structure and instructions only. No app import flow is described here.

---

## What this sheet is for

- **One place** for historical leads and booked deals.
- **One row = one lead.** If that lead later booked, you fill in **Booked Date** and **Booked Revenue** on the same row.
- When the import tool exists, exporting this sheet as CSV will:
  - Add **inquiries** to the Funnel (from rows with Date Inquired — see “Weddings vs non-weddings” below).
  - Add **bookings** to Sales and **closes + revenue** to the Funnel (from rows with Booked Date + Booked Revenue; funnel only for wedding rows if we use that rule).

---

## Weddings vs non-weddings (important)

- **Funnel** in the app today only tracks **wedding** leads (inquiries and closes). It’s wedding-focused.
- **Sales** in the app is set up to allow **non-wedding** sales (portraits, events, etc.).

So: if we pull in every row as an inquiry, we’d be mixing wedding and non-wedding leads into the funnel, which doesn’t match how the funnel is used.

**Ways to solve it:**

| Option | What it means | Pros | Cons |
|--------|----------------|-----|------|
| **A) Funnel by Service Type** | Expand the Funnel to track leads (and maybe revenue) by Service Type, not just “one funnel.” | One sheet for everything; funnel can show weddings vs non-weddings or multiple funnels. | Bigger product change; funnel UI and logic get more complex. |
| **B) Sales = Weddings only** | Simplify Sales so the app only allows wedding-related bookings. Funnel and Sales stay aligned. | No confusion; one definition of “lead” and “booking.” | You lose non-wedding sales in the app. |
| **C) Filter at import** | Keep one sheet with all leads/bookings. When importing: **Funnel** only gets rows where Service Type is “Wedding” (or a designated type); **Sales** gets all rows. | No product change to Funnel or Sales; just import rules. Sheet stays simple. | Users must use a consistent Service Type (e.g. “Wedding”) for funnel rows; non-wedding rows still create bookings but don’t touch the funnel. |

Until you choose A, B, or C, the sheet includes **Service Type** so you can at least mark which rows are weddings. If you go with C, the import tool would only add funnel events for rows where Service Type indicates wedding.

---

## How to create your sheet

### Option A: Start from the template CSV (recommended)

1. **Get the template**  
   In the app repo: `analytics-vite-app/public/templates/universal-import-template.csv`  
   (Or host this file somewhere users can download.)

2. **Create the Google Sheet**  
   - Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
   - **File → Import → Upload** and choose the template CSV.
   - Choose **“Replace spreadsheet”** or **“Insert new sheet(s)”** and click **Import data**.
   - Rename the sheet tab to something like **“Leads & Bookings”**.

3. **Keep row 1 as the header row**  
   Don’t change the column headers in row 1.

### Option B: Create the sheet from scratch

1. Create a new Google Sheet.
2. In **row 1**, add exactly these column headers (one per cell):

   | A              | B             | C            | D             | E            | F              | G            | H               | I             |
   |----------------|---------------|--------------|---------------|--------------|----------------|--------------|-----------------|---------------|
   | Date Inquired  | Project Name  | Client Name  | Client Email  | Lead Source  | Service Type   | Booked Date  | Booked Revenue | Project Date  |

3. From **row 2** onward, add one row per lead (see “What to put in each column” below).

---

## Column-by-column instructions

| Column | Required? | What to enter | Example |
|--------|-----------|----------------|---------|
| **Date Inquired** | **Yes** | When the lead first came in (inquiry date). | `2024-03-15` or `3/15/2024` or `Mar 15, 2024` |
| **Project Name** | **No*** | Name of the project/job/event. | `Smith Wedding`, `Headshots – Jane` |
| **Client Name** | **No*** | Client or contact name. *You must have **at least one** of Project Name or Client Name. If Project Name is blank, we use Client Name as the project name for the booking. | `John & Jane Smith` |
| **Client Email** | No | Email address (for reference). | `jane@example.com` |
| **Lead Source** | No | Where they came from. Use consistent names so the app doesn’t create duplicates. | `Instagram`, `Referral`, `Website` |
| **Service Type** | No (but important for funnel) | Type of service. Use consistent names. Needed if we filter funnel by “Wedding” (e.g. `Wedding`, `Portrait`, `Event`). | `Wedding`, `Portrait`, `Event` |
| **Booked Date** | No | When they signed/booked. **Only fill this if they actually booked.** | `2024-04-01` |
| **Booked Revenue** | No* | Total booked amount in **dollars** (numbers only; no $ or commas needed). *Required when Booked Date is filled. | `4500` or `4500.50` |
| **Project Date** | No | Event or service date (e.g. wedding date, shoot date). | `2024-08-20` |

**Rules of thumb**

- Every row must have **Date Inquired** and **at least one of Project Name or Client Name**.
- For a **booking** (Sales), we need a display name: use **Project Name** if present, otherwise **Client Name**.
- **Notes**: There are no notes for Sales data in this sheet; the column is not used.
- If the lead **did not book**, leave **Booked Date** and **Booked Revenue** blank.
- If the lead **did book**, fill **Booked Date** and **Booked Revenue** (and optionally Service Type, Lead Source, Project Date).

---

## Date and number formats

- **Dates**  
  Use any of: `YYYY-MM-DD`, `MM/DD/YYYY`, `M/D/YYYY`, or `Mon DD, YYYY` (e.g. `Mar 15, 2024`). The import will normalize these later.

- **Booked Revenue**  
  Enter numbers in **dollars**. You can use decimals (e.g. `3500.50`). Symbols like `$` and commas are optional; they’ll be stripped during import.

---

## User workflow (high level)

1. **Create the sheet** (template or from scratch) and keep the header row as above.
2. **Add past leads** – one row per lead, with Date Inquired and at least Project Name or Client Name.
3. **For leads that booked** – fill Booked Date, Booked Revenue, and any other columns you use.
4. **Use Service Type** so we can tell weddings from non-weddings (e.g. “Wedding” for funnel-relevant rows if we use filter-at-import).
5. **Keep Service Type and Lead Source consistent** – same spelling so the app doesn’t create duplicate types/sources.
6. **When the app supports it** – export this sheet as CSV and import for Funnel (wedding rows only, if we use that rule) and Sales (all booked rows).

---

## Quick reference: what each column will map to

| Sheet column     | Funnel use              | Sales use (booking)      |
|------------------|-------------------------|---------------------------|
| Date Inquired    | Inquiry date            | Date inquired             |
| Project Name     | —                       | Project name (or Client Name if blank) |
| Client Name      | —                       | Fallback for project name if Project Name blank |
| Client Email     | —                       | Client email             |
| Lead Source      | —                       | Lead source (by name)    |
| Service Type     | Which rows count (e.g. Wedding only) | Service type (by name) |
| Booked Date      | Close date              | Booking date              |
| Booked Revenue   | Bookings revenue        | Booked revenue            |
| Project Date     | —                       | Project/event date        |

---

## Template location

- **CSV template (for creating the Google Sheet):**  
  `analytics-vite-app/public/templates/universal-import-template.csv`

The template has the header row and example rows (including one with Client Name but no Project Name). Replace the examples with your own data.
