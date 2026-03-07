import { Request, Response, NextFunction } from "express";
import { EmployeeRole } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { JWTPayload } from "../@types";
import prisma from "../config/prisma.config";

export function verifyRole(
  allowedRoles: EmployeeRole[],
  options: { critical?: boolean } = {},
) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Ambil payload dari res.locals (hasil dari verifyToken)
      const user = res.locals.payload as JWTPayload;

      // Pastikan user & role ada di token
      if (!user || !user.role || !user.userId) {
        return next(AppError("Unauthorized: Invalid token payload", 401));
      }

      // Validasi role dari JWT
      if (!allowedRoles.includes(user.role as EmployeeRole)) {
        return next(
          AppError(
            `Forbidden: Only ${allowedRoles.join(", ")} can access this resource`,
            403,
          ),
        );
      }

      // Critical endpoint check: Verify ke database (SECURE)
      // Hanya untuk endpoint yang butuh extra security
      if (options.critical) {
        const employee = await prisma.employee.findUnique({
          where: { id: user.userId, deletedAt: null },
          select: {
            id: true,
            role: true,
            outletId: true,
          },
        });

        // Cek apakah employee masih ada dan rolenya masih sama
        if (!employee) {
          return next(
            AppError("Unauthorized: Employee not found or deleted", 401),
          );
        }

        if (employee.role !== user.role) {
          return next(
            AppError(
              "Unauthorized: Role has been changed. Please login again",
              401,
            ),
          );
        }

        // Simpan data employee ke res.locals untuk digunakan di controller
        res.locals.employee = employee;
      } else {
        // Untuk non-critical endpoint, simpan data dari JWT saja
        res.locals.employee = {
          id: user.userId,
          role: user.role,
        };
      }

      next(); // Lolos
    } catch (error) {
      next(error);
    }
  };
}

export const verifyWorker = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = res.locals.payload as JWTPayload | undefined;

      // Pastikan payload dan role tersedia
      if (!user || !user.role) {
        return next(AppError("Unauthorized: Invalid token payload", 401));
      }

      const role = user.role;

      const allowedRoles: EmployeeRole[] = [
        EmployeeRole.SUPER_ADMIN,
        EmployeeRole.OUTLET_ADMIN,
        EmployeeRole.WORKER_WASHING,
        EmployeeRole.WORKER_IRONING,
        EmployeeRole.WORKER_PACKING,
      ];

      if (!allowedRoles.includes(role as EmployeeRole)) {
        throw AppError(
          "Forbidden: Only workers and admins can access this resource",
          403,
        );
      }

      // Set res.locals.employee agar konsisten dengan middleware lain
      res.locals.employee = {
        id: user.userId,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const verifySuperAdmin = (critical = false) =>
  verifyRole([EmployeeRole.SUPER_ADMIN], { critical });

export const verifyAdmin = (critical = false) =>
  verifyRole([EmployeeRole.SUPER_ADMIN, EmployeeRole.OUTLET_ADMIN], {
    critical,
  });
