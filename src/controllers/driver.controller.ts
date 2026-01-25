import { Request, Response } from "express";
import { z } from "zod";
import * as driverService from "../services/driver.service";

const checkAvailabilitySchema = z.object({
  driverId: z.string(),
});

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { driverId } = checkAvailabilitySchema.parse(req.body);

    const result = await driverService.checkAvailability(driverId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: (error as any).errors,
      });
      return;
    }

    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
