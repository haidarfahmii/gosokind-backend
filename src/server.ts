import express, { Express, NextFunction, Request, Response } from "express";
import authRouter from "./routers/auth.route";
import profileRouter from "./routers/profile.route";
import dotenv from "dotenv"
import { corsOptions } from "./middlewares/cors.options.middleware";

dotenv.config()

const app: Express = express();
app.use(corsOptions);
app.use(express.json());
const port = 5000;

app.get("/", (_: Request, res: Response) => {
  res.status(200).json({
    message: "Gosokind App API is Running 🚀",
  });
});

app.use("/api/auth", authRouter)
app.use("/api/profile", profileRouter)

/*
  Middleware (Application Level)
*/
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

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
