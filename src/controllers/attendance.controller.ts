import { Request, Response } from "express";
import { z } from "zod";
import * as attendanceService from "../services/attendance.service";

const attendanceSchema = z.object({
  employeeId: z.string(),
  latitude: z.number().optional(), // should i??
  longitude: z.number().optional(),
});

export const clockIn = async (req: Request, res: Response) => {
  try {
    const { employeeId, latitude, longitude } = attendanceSchema.parse(req.body);

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: "Latitude and Longitude are required." });
      return;
    }

    const result = await attendanceService.clockIn(employeeId, latitude, longitude);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === "ALREADY_CLOCKED_IN") {
      res.status(400).json({ success: false, message: "User is already clocked in." });
      return;
    }
    if (error.message === "OUT_OF_RANGE") {
      res.status(400).json({ success: false, message: "You are too far from the outlet." });
      return;
    }
    if (error.message === "MULTIPLE_SHIFTS_NOT_ALLOWED") {
        res.status(400).json({ success: false, message: "Multiple shifts are not allowed." });
        return; 
    }
    if (error.message === "NO_OUTLET_ASSIGNED") {
      res.status(400).json({ success: false, message: "No outlet assigned to this specific employee account." });
      return;
    }
    handleError(error, res);
  }
};

export const clockOut = async (req: Request, res: Response) => {
  try {
    const { employeeId } = attendanceSchema.parse(req.body);
    const result = await attendanceService.clockOut(employeeId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === "NOT_CLOCKED_IN") {
        res.status(400).json({ success: false, message: "User is not clocked in." });
        return;
    }
    handleError(error, res);
  }
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const employeeId = req.query.employeeId as string;
    const date = req.query.date as string | undefined;
    
    if (!employeeId) {
       res.status(400).json({ success: false, message: "Employee ID is required." });
       return;
    }
    const data = await attendanceService.getDashboardData(employeeId, date);
    res.json({ success: true, data });
  } catch (error: any) {
    handleError(error, res);
  }
};

function handleError(error: any, res: Response) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ success: false, message: "Validation Error", errors: (error as any).errors });
    return;
  }
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}
