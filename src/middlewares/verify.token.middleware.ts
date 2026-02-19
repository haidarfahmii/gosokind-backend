import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../@types";
import { AppError } from "../utils/app-error";

export function verifyToken(secretKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req?.headers?.authorization?.split(" ")[1];

      // validasi token ada?
      if (!token) {
        throw AppError("Unauthorized: No token provided", 401); // lempar ke catch
      }

      // verify
      const payload = (await jwt.verify(token, secretKey)) as JWTPayload;

      res.locals.payload = payload;

      next(); // lanjut ke controller
    } catch (error) {
      // oper ke error global middleware di server.ts
      if (error instanceof Error) {
        (error as any).statusCode = 401;
      }
      next(error);
    }
  };
}
