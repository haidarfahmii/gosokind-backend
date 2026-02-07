import { Request, Response, NextFunction } from "express";
import cors from "cors";
import { WHITELIST, NEXT_AUTH_SECRET_KEY } from "../config/index.config";

export function corsOptions(req: Request, res: Response, next: NextFunction) {
  const nextAuthSecretKey = req?.headers["next-auth-secret-key"];

  // terima request dari NextAuth dengan secret key
  if (nextAuthSecretKey === NEXT_AUTH_SECRET_KEY) {
    return next();
  }

  // apply CORS untuk request lain
  return cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin || WHITELIST.indexOf(requestOrigin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })(req, res, next);
}
