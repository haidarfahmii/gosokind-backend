import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import "dotenv/config";

import routes from "./routes";

const app: Express = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

app.use("/api", routes);

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
