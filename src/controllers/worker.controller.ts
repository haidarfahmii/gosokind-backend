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
  // Worker melihat daftar pesanan yang masuk ke stationnya
  async getOrderList(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const station = mapRoleToStation(payload.role as string);

      if (!station) {
        return res
          .status(400)
          .json({
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

  // Worker melihat history pekerjaan pribadi
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

  // Worker memproses order di stationnya
  async processOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as JWTPayload;
      const parsed = processOrderSchema.safeParse(req.body);

      if (!parsed.success) {
        return res
          .status(400)
          .json({
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
      const statusMap: Record<string, number> = {
        QTY_MISMATCH: 400,
        ORDER_NOT_FOUND: 404,
      };
      const status = statusMap[error.message];
      if (status) {
        return res
          .status(status)
          .json({ success: false, message: error.message });
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
