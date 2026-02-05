# Rules for Feature 3: Driver & Worker Management (MVP)

## 1. Architecture Standards
- **Backend:** Layered Architecture (Route -> Controller -> Service).
- **Frontend:** Mobile First, Component-based (Cards over Tables).
- **Strict Constraint:** Max 200 lines per file. Max 15 lines per function.

## 2. Business Logic & Constraints

### A. Attendance
- User cannot perform any job if they have not **Clocked In** for the current date.

### B. Driver Logic (Single Threaded)
- **Constraint:** A driver can only process ONE active order at a time.
- **Availability:** Backend must check `Order` table. If active order exists -> Reject new job request.

### C. Worker Station Logic (Validation Core)
- **Goal:** Validate physical item count against Admin's data (`OrderItem`).
- **Process:**
  1. Worker inputs Quantity for each item.
  2. Backend compares Input vs `OrderItem`.
  3. **IF MATCH:** Update Order Status to next station.
  4. **IF MISMATCH:** Throw `QTY_MISMATCH` error (400). Do NOT update status.
  5. **Bypass:** Worker must submit `createBypassRequest` (Text reason only).

## 3. Tech Stack Specifics
- **Backend:** Node.js, Prisma, Zod, date-fns.
- **Frontend:** Next.js App Router, Tailwind, Axios, React Hot Toast.

## 4. Workspace Isolation Protocols (STRICT)
**Context:** The workspace contains two distinct root folders (`gosokind-frontend` and `gosokind-backend`). They are separate GitHub repositories.

1.  **The "Firewall" Rule:**
    - **NEVER** import files relatively between root folders (e.g., `import ... from '../../gosokind-backend/...'` is STRICTLY FORBIDDEN).
    - Frontend code must **NEVER** import `prisma`, `bcrypt`, or database models directly.
    - Backend code must **NEVER** import React components or frontend hooks.

2.  **Communication Protocol:**
    - Interaction between Frontend and Backend MUST occur **ONLY** via HTTP Requests defined in `api_spec.md`.
    - Frontend relies on `src/services/api.ts` (Axios) to talk to the Backend.

3.  **Dependency Isolation:**
    - When installing packages, ALWAYS specify the target folder (e.g., `cd gosokind-backend && npm install ...`).
    - Do not create a shared `package.json` in the root.

## 5. API Design & Implementation Standards (NEW)
**Goal:** Ensure consistency across all endpoints consumed by the Frontend.

1.  **Naming Conventions:**
    - **URLs:** Use kebab-case (e.g., `/clock-in`, `/bypass-request`).
    - **JSON Keys:** Use camelCase (e.g., `employeeId`, `isVerified`). No snake_case in JSON response.

2.  **Standard Response Envelope:**
    All API responses MUST follow this structure:
    ```json
    {
      "success": true,   // Boolean status
      "message": "...",  // Optional: User-friendly message
      "data": { ... }    // Optional: Payload object
    }
    ```

3.  **HTTP Status Codes:**
    - `200 OK`: Success (GET/PUT/PATCH).
    - `201 Created`: Success (POST creating new resource).
    - `400 Bad Request`: Validation error (Zod) or Logic error (e.g., Qty Mismatch).
    - `401 Unauthorized`: Invalid/Missing Token.
    - `404 Not Found`: Resource ID does not exist.
    - `500 Internal Server Error`: Unhandled crashes.

4.  **Error Handling:**
    - Never return raw HTML stack traces.
    - Always return JSON: `{ "success": false, "message": "Specific error description" }`.