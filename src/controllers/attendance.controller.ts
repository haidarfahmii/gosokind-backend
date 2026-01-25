import { Request, Response } from "express";
import { z } from "zod";
import * as attendanceService from "../services/attendance.service";

const attendanceSchema = z.object({
  employeeId: z.string(),
});

export const clockIn = async (req: Request, res: Response) => {
  try {
    const { employeeId } = attendanceSchema.parse(req.body);
    const result = await attendanceService.clockIn(employeeId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === "ALREADY_CLOCKED_IN") {
      res.status(400).json({ success: false, message: "User is already clocked in." });
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

function handleError(error: any, res: Response) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ success: false, message: "Validation Error", errors: (error as any).errors });
    return;
  }
  console.error(error);
  res.status(500).json({ success: false, message: "Internal Server Error" });
}
