# API Contract (Feature 3)

Base URL: `http://localhost:5000/api`

## ✅ Currently Implemented Endpoints

The following endpoints are functional and connected to the database.

### 1. Attendance

**`POST /attendance/clock-in`**

- **Description**: Workers/Drivers clock in for the day.
- **Request Body**:
  ```json
  {
    "employeeId": "cm... (CUID)"
  }
  ```
- **Responses**:
  - `200 OK`: `{ success: true, data: { ...AttendanceObj } }`
  - `400 Bad Request`: `{ success: false, message: "User is already clocked in." }`

**`POST /attendance/clock-out`**

- **Description**: Workers/Drivers clock out.
- **Request Body**:
  ```json
  {
    "employeeId": "cm... (CUID)"
  }
  ```
- **Responses**:
  - `200 OK`: `{ success: true, data: { ...AttendanceObj } }`
  - `400 Bad Request`: `{ success: false, message: "User is not clocked in." }`

### 2. Driver

**`POST /driver/availability`**

- **Description**: Check if a driver is available to take a new job.
- **Request Body**:
  ```json
  {
    "driverId": "cm... (CUID)"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "available": true // or false
      }
    }
    ```
  - `200 OK (Busy)`:
    ```json
    {
      "success": true,
      "data": {
        "available": false,
        "reason": "Currently handling a pickup"
      }
    }
    ```

### 3. Worker (Washing / Ironing / Packing)

**`POST /worker/process`**

- **Description**: Submit results of a station process (e.g. counting items at washing station).
- **Request Body**:
  ```json
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
  ```
- **Responses**:
  - `200 OK`: Process recorded successfully.
  - `400 Bad Request` (Validation Failed):
    ```json
    {
      "success": false,
      "code": "QTY_MISMATCH",
      "message": "Quantity mismatch between input and system records."
    }
    ```

---

## 🚧 Planned Endpoints (Not Implemented Yet)

These endpoints are part of the design but have not been coded in the controllers/routes yet.

### Attendance

- `GET /attendance/history/:employeeId`

### Driver

- `GET /driver/jobs?driverId=...`
- `POST /driver/accept` (Accept a job)
- `POST /driver/complete` (Finish a delivery/pickup)

### Worker

- `GET /worker/orders?outletId=...&station=WASHING` (Get queue of jobs)
- `POST /worker/bypass` (Request bypass for quantity mismatch)
