import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import "dotenv/config";

// IMPORT ROUTE SECARA LANGSUNG (Explicit)
// Pastikan path-nya sesuai dengan struktur folder 
import authRoute from "./routes/auth.route";
import attendanceRoute from "./routes/attendance.route";
import driverRoute from "./routes/driver.route";
import workerRoute from "./routes/worker.route";
import bypassRoute from "./routes/bypass.route";

const app: Express = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// --- MOUNT ROUTES (PENTING!) ---
// Ini mendefinisikan prefix URL secara jelas.

// 1. Auth: /api/auth/login
app.use("/api/auth", authRoute);

// 2. Attendance: /api/attendance/clock-in
app.use("/api/attendance", attendanceRoute);

// 3. Driver: /api/driver/pickup/accept
app.use("/api/driver", driverRoute); 

// 4. Worker: /api/worker/process
app.use("/api/worker", workerRoute);

// 5. Bypass: /api/bypass
app.use("/api/bypass", bypassRoute);

// Basic health check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Gosokind API is running" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;