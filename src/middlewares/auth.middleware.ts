import { Request, Response, NextFunction } from "express";
import { verifyToken as verifyJwt } from "../lib/auth";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyJwt(token);

  if (!payload) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
    return;
  }

  (req as any).user = payload; 
  next();
};
