import express, { Express, NextFunction, Request, Response } from "express";
import authRouter from "./routers/auth.route";
import profileRouter from "./routers/profile.route";
import addressRouter from "./routers/address.route";
import { errorHandler } from "./middlewares/error.handler.middleware";
import { PORT } from "./config/index.config";
import { corsOptions } from "./middlewares/cors.options.middleware";
import employeeAuthRoute from "./routers/employee-auth.route";
import employeeRoute from "./routers/employee.route";
import outletRoute from "./routers/outlet.route";
import laundryItemRoute from "./routers/laundry-item.route";
import orderRoute from "./routers/order.route";
import customerOrderRoute from "./routers/customer-order.route";

import dotenv from "dotenv";

dotenv.config();

const app: Express = express();

app.use(corsOptions);
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Gosokind App API is Running 🚀");
});

app.use("/api/auth", authRouter)
app.use("/api/profile", profileRouter)
app.use("/api/addresses", addressRouter);
app.use("/api/auth/employee", employeeAuthRoute);
app.use("/api/employees", employeeRoute);
app.use("/api/outlets", outletRoute);
app.use("/api/laundry-items", laundryItemRoute);
app.use("/api/orders", orderRoute);
app.use("/api/customer/orders", customerOrderRoute);

// Middleware (Application Level)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err?.statusCode ? err?.statusCode : 500;
  const message = err?.isOperational ? err?.message : "Something went wrong!";

  // Log error untuk debugging di server
  console.error("❌ Error:", err);
  // Handle Prisma Validation / Database Errors
  if (err.code === "P2002") {
    // Unique constraint violation
    return res.status(409).json({
      success: false,
      message: "Data already exists (Unique constraint violation)",
      data: null,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

// Global Error Handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});

export default app;
