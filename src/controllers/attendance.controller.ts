import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as attendanceService from "../services/attendance.service";
import { EmployeeRole } from "@prisma/client";
import { JWTPayload } from "../@types";

const attendanceSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const attendanceController = {
  async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const userId = payload.userId;

      const parsed = attendanceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Latitude and Longitude are required as numbers.",
          errors: parsed.error.issues,
        });
      }

      const { latitude, longitude } = parsed.data;
      const result = await attendanceService.clockIn(
        userId,
        latitude,
        longitude,
      );

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      const errorMap: Record<string, { status: number; message: string }> = {
        ALREADY_CLOCKED_IN: {
          status: 400,
          message: "User is already clocked in.",
        },
        OUT_OF_RANGE: {
          status: 400,
          message: "You are too far from the outlet.",
        },
        NO_OUTLET_ASSIGNED: {
          status: 400,
          message: "No outlet assigned to this employee account.",
        },
        EMPLOYEE_NOT_FOUND: { status: 404, message: "Employee not found." },
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return res
          .status(mapped.status)
          .json({ success: false, message: mapped.message });
      }
      next(error);
    }
  },

  async clockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const userId = payload.userId;

      const result = await attendanceService.clockOut(userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message === "NOT_CLOCKED_IN") {
        return res
          .status(400)
          .json({ success: false, message: "User is not clocked in." });
      }
      next(error);
    }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const { userId, role } = payload;
      const queryId = req.query.employeeId as string;
      const date = req.query.date as string | undefined;

      // RBAC: Only SUPER_ADMIN/OUTLET_ADMIN can request other employee's data
      let targetId = userId;
      if (
        role === EmployeeRole.SUPER_ADMIN ||
        role === EmployeeRole.OUTLET_ADMIN
      ) {
        targetId = queryId || userId;
      }

      const data = await attendanceService.getDashboardData(targetId, date);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getAllAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const scopedOutletId = res.locals.scopedOutletId as string | null;

      if (!scopedOutletId) {
        return res.status(403).json({
          success: false,
          message:
            "You must be assigned to an outlet to view attendance records.",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const date = req.query.date as string | undefined;

      const result = await attendanceService.getAllAttendance(
        scopedOutletId,
        page,
        limit,
        date,
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};
