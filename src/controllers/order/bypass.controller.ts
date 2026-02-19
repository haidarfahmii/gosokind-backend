import { Request, Response, NextFunction } from "express";
import { orderService } from "../../services/order/order.service";
import {
  CreateBypassRequestInput,
  HandleBypassRequestInput,
} from "../../@types/order.types";

export const bypassController = {
  async createBypassRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const input: CreateBypassRequestInput = {
        ...req.body,
        orderId,
      };
      const workerId = res.locals.payload.userId;
      const scopedOutletId = res.locals.scopedOutletId;

      const bypassRequest = await orderService.createBypassRequest(
        input,
        workerId,
        scopedOutletId,
      );

      res.status(201).json({
        success: true,
        message: "Bypass request created successfully",
        data: bypassRequest,
      });
    } catch (error) {
      next(error);
    }
  },

  async handleBypassRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const bypassRequestId = req.params.id as string;
      const input: HandleBypassRequestInput = req.body;
      const adminId = res.locals.payload.userId;
      const scopedOutletId = res.locals.scopedOutletId;
      const isSuperAdmin = res.locals.isSuperAdmin;

      const bypassRequest = await orderService.handleBypassRequest(
        bypassRequestId,
        input,
        adminId,
        scopedOutletId,
        isSuperAdmin,
      );

      res.status(200).json({
        success: true,
        message: `Bypass request ${input.action.toLowerCase()} successfully`,
        data: bypassRequest,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPendingBypassRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const outletId = req.query.outletId as string | undefined;
      const scopedOutletId = res.locals.scopedOutletId;
      const isSuperAdmin = res.locals.isSuperAdmin;

      const result = await orderService.getPendingBypassRequests(
        page,
        limit,
        outletId,
        scopedOutletId,
        isSuperAdmin,
      );

      res.status(200).json({
        success: true,
        message: "Pending bypass requests retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
