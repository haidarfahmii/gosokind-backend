import express, { Express, Request, Response } from "express";

const app: Express = express();
app.use(express.json());
const port = 5000;

app.get("/", (_: Request, res: Response) => {
  res.status(200).json({
    message: "Express API Server",
  });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
