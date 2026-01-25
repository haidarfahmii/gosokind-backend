# Rules for Feature 3: Driver & Worker Management (MVP)

## 1. Architecture Standards
- **Backend:** Layered Architecture (Route -> Controller -> Service).
- **Frontend:** Mobile First, Component-based (Cards over Tables).
- **Strict Constraint:** Max 200 lines per file. Max 15 lines per function.

## 2. Business Logic & Constraints

### [cite_start]A. Attendance [cite: 217-225]
- User cannot perform any job if they have not **Clocked In** for the current date.

### [cite_start]B. Driver Logic (Single Threaded) [cite: 234]
- **Constraint:** A driver can only process ONE active order at a time.
- **Availability:** Backend must check `Order` table. If active order exists -> Reject new job request.

### [cite_start]C. Worker Station Logic (Validation Core) [cite: 244-246]
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