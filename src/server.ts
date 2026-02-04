import express, { Express, NextFunction, Request, Response } from "express";
import authRouter from "./routers/auth.route";
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

/*
  Middleware (Application Level)
*/
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err.message);
  const statusCode = err?.statusCode ? err?.statusCode : 500;
  const message = err?.isOperational
    ? err?.message
    : err.message === 'File too large'
      ? err.message
      : 'Something went wrong!';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
