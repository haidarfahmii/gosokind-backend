import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload | { 
        userId: string; 
        role: string; 
        outletId?: string 
      };
    }
  }
}