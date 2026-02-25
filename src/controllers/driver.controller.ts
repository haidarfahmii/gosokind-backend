import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as driverService from "../services/driver.service";
import { JWTPayload } from "../@types";

const orderIdSchema = z.object({
  orderId: z.string().cuid({ message: "Invalid Order ID format" }),
});

export const driverController = {
  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const result = await driverService.checkAvailability(payload.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getActiveJob(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const result = await driverService.getDriverActiveJob(payload.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAvailableJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await driverService.getAvailableJobs();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async acceptPickup(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const parsed = orderIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Validation Error",
            errors: parsed.error.issues,
          });
      }

      await driverService.acceptPickup(payload.userId, parsed.data.orderId);
      res.json({ success: true, message: "Pickup accepted successfully" });
    } catch (error: any) {
      handleDriverError(res, next, error);
    }
  },

  async completePickup(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const parsed = orderIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Validation Error",
            errors: parsed.error.issues,
          });
      }

      await driverService.completePickup(payload.userId, parsed.data.orderId);
      res.json({
        success: true,
        message: "Pickup completed. Laundry arrived at outlet.",
      });
    } catch (error: any) {
      handleDriverError(res, next, error);
    }
  },

  async acceptDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const parsed = orderIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Validation Error",
            errors: parsed.error.issues,
          });
      }

      await driverService.acceptDelivery(payload.userId, parsed.data.orderId);
      res.json({ success: true, message: "Delivery accepted successfully" });
    } catch (error: any) {
      handleDriverError(res, next, error);
    }
  },

  async completeDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const parsed = orderIdSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Validation Error",
            errors: parsed.error.issues,
          });
      }

      await driverService.completeDelivery(payload.userId, parsed.data.orderId);
      res.json({ success: true, message: "Delivery completed successfully" });
    } catch (error: any) {
      handleDriverError(res, next, error);
    }
  },
};

function handleDriverError(res: Response, next: NextFunction, error: any) {
  const statusMap: Record<string, number> = {
    DRIVER_BUSY: 400,
    ORDER_UNAVAILABLE: 409,
    ORDER_NOT_FOUND_OR_INVALID: 404,
  };
  const status = statusMap[error.message];
  if (status) {
    return res.status(status).json({ success: false, message: error.message });
  }
  next(error);
}
