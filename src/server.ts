import express, { Express, Request, Response } from "express";
import authRouter from "./routers/auth.route";
import dotenv from "dotenv"

dotenv.config()

const app: Express = express();
app.use(express.json());
const port = 5000;

app.get("/", (_: Request, res: Response) => {
  res.status(200).json({
    message: "Gosokind App API is Running 🚀",
  });
});

app.use("/api/auth", authRouter)

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
