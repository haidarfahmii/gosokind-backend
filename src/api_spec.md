# API Contract (Feature 3 + Auth)

Base URL: `http://localhost:5001/api` (Ensure port matches your backend .env)

## ✅ Currently Implemented Endpoints

The following endpoints are functional and connected to the database.

### 1. Authentication (New)

**`POST /auth/login`**
- **Description**: Validates email/password and returns a JWT token with user details.
- **Request Body**:
  ```json
  {
    "email": "aziz@gosokind.com",
    "password": "password123"
  }
Responses:

200 OK:

JSON
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": { 
      "id": "cm...", 
      "role": "WORKER_WASHING", 
      "fullName": "Aziz",
      "outletId": "outlet-cisauk-01" 
    }
  }
}
401 Unauthorized:

JSON
{ "success": false, "message": "Invalid credentials" }
GET /auth/me

Description: Validates current session via Bearer Token.

Headers: Authorization: Bearer <token>

Responses:

200 OK:

JSON
{ 
  "success": true, 
  "data": { 
    "user": { 
      "id": "cm...", 
      "role": "WORKER_WASHING", 
      "fullName": "Aziz" 
    } 
  }
}
401 Unauthorized: Token invalid or expired.

2. Attendance
POST /attendance/clock-in

Description: Workers/Drivers clock in for the day.

Request Body:

JSON
{
  "employeeId": "cm... (CUID)"
}
Responses:

200 OK: { "success": true, "data": { ...AttendanceObj } }

400 Bad Request: { "success": false, "message": "User is already clocked in." }

POST /attendance/clock-out

Description: Workers/Drivers clock out.

Request Body:

JSON
{
  "employeeId": "cm... (CUID)"
}
Responses:

200 OK: { "success": true, "data": { ...AttendanceObj } }

400 Bad Request: { "success": false, "message": "User is not clocked in." }

3. Driver
POST /driver/availability

Description: Check if a driver is available to take a new job.

Request Body:

JSON
{
  "driverId": "cm... (CUID)"
}
Responses:

200 OK:

JSON
{
  "success": true,
  "data": {
    "available": true 
  }
}
200 OK (Busy):
JSON
{
  "success": true,
  "data": {
    "available": false,
    "reason": "Currently handling a pickup"
  }
}
4. Worker (Washing / Ironing / Packing)
POST /worker/process

Description: Submit results of a station process (e.g. counting items at washing station).

Request Body:

JSON
{
  "orderId": "cm... (CUID)",
  "workerId": "cm... (CUID)",
  "station": "WASHING", // Enum: WASHING, IRONING, PACKING
  "items": [
    {
      "laundryItemId": "cm...",
      "quantity": 5
    }
  ]
}
Responses:

200 OK: Process recorded successfully.

400 Bad Request (Validation Failed):

JSON
{
  "success": false,
  "code": "QTY_MISMATCH",
  "message": "Quantity mismatch between input and system records."
}
🚧 Planned Endpoints (Not Implemented Yet)
These endpoints are part of the design but have not been coded in the controllers/routes yet.

Attendance
GET /attendance/history/:employeeId

Driver
GET /driver/jobs?driverId=...

POST /driver/accept (Accept a job)

POST /driver/complete (Finish a delivery/pickup)

Worker
GET /worker/orders?outletId=...&station=WASHING (Get queue of jobs)

POST /worker/bypass (Request bypass for quantity mismatch)