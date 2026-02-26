import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as workerService from "../services/worker.service";
import { StationType, EmployeeRole } from "@prisma/client";
import { JWTPayload } from "../@types";

const processOrderSchema = z.object({
  orderId: z.string().cuid(),
  station: z.nativeEnum(StationType),
  items: z
    .array(
      z.object({
        laundryItemId: z.string(),
        quantity: z.number().int().min(0),
      }),
    )
    .nonempty(),
});

export const workerController = {
  async getOrderList(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const station = mapRoleToStation(payload.role as string);

      if (!station) {
        return res.status(400).json({
          success: false,
          message: "Invalid Worker Role for station access",
        });
      }

      const result = await workerService.getIncomingOrders(
        station,
        page,
        limit,
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async getJobHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await workerService.getWorkerHistory(
        payload.userId,
        page,
        limit,
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async processOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const parsed = processOrderSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: parsed.error.issues,
        });
      }

      const { orderId, station, items } = parsed.data;

      const result = await workerService.processStationOrder({
        workerId: payload.userId,
        orderId,
        station,
        items,
      });

      res.json({
        success: true,
        message: "Order processed successfully",
        data: result,
      });
    } catch (error: any) {
      // QTY_MISMATCH: frontend akan buka BypassModal
      if (error.message === "QTY_MISMATCH") {
        return res.status(400).json({
          success: false,
          message: "QTY_MISMATCH",
          details: error.details || [],
        });
      }

      // ORDER_ON_HOLD: ada bypass PENDING, order tidak bisa diproses
      if (error.message === "ORDER_ON_HOLD") {
        return res.status(400).json({
          success: false,
          message:
            "Order is on hold. There is a pending bypass request waiting for admin approval.",
        });
      }

      if (error.message === "ORDER_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      next(error);
    }
  },
};

function mapRoleToStation(role: string): StationType | null {
  if (role === EmployeeRole.WORKER_WASHING) return StationType.WASHING;
  if (role === EmployeeRole.WORKER_IRONING) return StationType.IRONING;
  if (role === EmployeeRole.WORKER_PACKING) return StationType.PACKING;
  return null;
}
