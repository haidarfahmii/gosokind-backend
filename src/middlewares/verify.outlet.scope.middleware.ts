import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import { JWTPayload } from "../@types";
import { EmployeeRole } from "@prisma/client";

export function verifyOutletScope() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ambil payload dari res.locals
      const user = res.locals.payload as JWTPayload;

      if (!user || !user.role) {
        return next(AppError("Unauthorized: Invalid token payload", 401));
      }

      // Super Admin: Bypass outlet scope checking
      if (user.role === EmployeeRole.SUPER_ADMIN) {
        res.locals.isSuperAdmin = true;
        res.locals.scopedOutletId = null; // null = akses semua outlet
        return next();
      }

      // Non-Super Admin: Harus punya outletId
      let outletId: string | null = null;

      if (res.locals.employee && res.locals.employee.outletId) {
        outletId = res.locals.employee.outletId;
      } else {
        outletId = (user as any).outletId || null;
      }

      if (!outletId) {
        return next(
          AppError(
            "Forbidden: Your account is not assigned to any outlet. Please contact Super Admin.",
            403,
          ),
        );
      }

      // Set outlet scope
      res.locals.isSuperAdmin = false;
      res.locals.scopedOutletId = outletId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Helper function untuk validate apakah user bisa akses resource tertentu
export function validateOutletAccess(
  resourceOutletId: string | null,
  scopedOutletId: string | null,
  isSuperAdmin: boolean,
): boolean {
  // Super Admin: always allowed
  if (isSuperAdmin) {
    return true;
  }

  // Resource tidak punya outlet (e.g., customer) - allowed
  if (!resourceOutletId) {
    return true;
  }

  // Check apakah outlet match
  return resourceOutletId === scopedOutletId;
}
