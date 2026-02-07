import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import prisma from "../config/prisma.config";
import { EmployeeRole } from "../generated/prisma/client";

/**
 * Middleware untuk memverifikasi bahwa user adalah Employee (bukan Customer)
 */
export async function verifyEmployee(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = res.locals.payload;

    if (!userId) {
      throw AppError("Unauthorized: User ID not found", 401);
    }

    // Cek apakah user adalah employee
    const employee = await prisma.employee.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        role: true,
        outletId: true,
      },
    });

    if (!employee) {
      throw AppError("Unauthorized: Employee not found", 403);
    }

    // Simpan data employee ke res.locals untuk digunakan di controller
    res.locals.employee = employee;

    next();
  } catch (error) {
    if (error instanceof Error) {
      (error as any).statusCode = (error as any).statusCode || 403;
    }
    next(error);
  }
}

/**
 * Middleware untuk memverifikasi bahwa user adalah Super Admin
 */
export async function verifySuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = res.locals.payload;

    if (!userId) {
      throw AppError("Unauthorized: User ID not found", 401);
    }

    // Cek apakah user adalah super admin
    const employee = await prisma.employee.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        role: true,
      },
    });

    if (!employee) {
      throw AppError("Unauthorized: Employee not found", 403);
    }

    if (employee.role !== "SUPER_ADMIN") {
      throw AppError(
        "Forbidden: Only Super Admin can access this resource",
        403,
      );
    }

    // Simpan data employee ke res.locals
    res.locals.employee = employee;

    next();
  } catch (error) {
    if (error instanceof Error) {
      (error as any).statusCode = (error as any).statusCode || 403;
    }
    next(error);
  }
}

/**
 * Middleware untuk memverifikasi role-based access
 * @param allowedRoles - Array of allowed roles
 */
export function verifyRoles(allowedRoles: EmployeeRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = res.locals.payload;

      if (!userId) {
        throw AppError("Unauthorized: User ID not found", 401);
      }

      // Cek apakah user adalah employee dengan role yang diizinkan
      const employee = await prisma.employee.findUnique({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          role: true,
          outletId: true,
        },
      });

      if (!employee) {
        throw AppError("Unauthorized: Employee not found", 403);
      }

      if (!allowedRoles.includes(employee.role)) {
        throw AppError(
          `Forbidden: Only ${allowedRoles.join(", ")} can access this resource`,
          403,
        );
      }

      // Simpan data employee ke res.locals
      res.locals.employee = employee;

      next();
    } catch (error) {
      if (error instanceof Error) {
        (error as any).statusCode = (error as any).statusCode || 403;
      }
      next(error);
    }
  };
}
