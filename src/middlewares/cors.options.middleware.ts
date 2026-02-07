import { Request, Response, NextFunction } from "express";
import { TAppError } from "../utils/app-error";

/**
 * Global Error Handler Middleware
 * Harus di-register setelah semua routes
 */
export function errorHandler(
  error: TAppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Log error untuk debugging
  console.error("❌ [Error]:", error.message);
  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", error.stack);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
}
