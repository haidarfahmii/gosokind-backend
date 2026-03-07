import { Request, Response, NextFunction } from "express";
import { orderService } from "../../services/order/order.service";
import {
  UpdateOrderStatusInput,
  UpdateDriverStatusInput,
} from "../../@types/order.types";

export const orderStatusController = {
  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const input: UpdateOrderStatusInput = req.body;
      const employeeId = res.locals.payload.userId;
      const employeeRole = res.locals.payload.role;
      const scopedOutletId = res.locals.scopedOutletId;
      const isSuperAdmin = res.locals.isSuperAdmin;

      const order = await orderService.updateOrderStatus(
        orderId,
        input,
        employeeId,
        employeeRole,
        scopedOutletId,
        isSuperAdmin,
      );

      res.status(200).json({
        success: true,
        message: `Order status updated to ${input.status}`,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateDriverStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const input: UpdateDriverStatusInput = req.body;
      const driverId = res.locals.payload.userId;

      if (input.driverId !== driverId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only update status for yourself",
          data: null,
        });
      }

      const order = await orderService.updateDriverStatus(
        orderId,
        input,
        driverId,
      );

      // Custom message based on status
      let message = `Order status updated to ${input.status}`;

      if (input.status === "PICKUP_ON_THE_WAY") {
        message = "Pickup accepted. On the way to customer address.";
      } else if (input.status === "ARRIVED_AT_OUTLET") {
        message = "Items picked up successfully. Arrived at outlet.";
      } else if (input.status === "DELIVERY_ON_THE_WAY") {
        message = "Delivery started. On the way to customer address.";
      } else if (input.status === "RECEIVED_BY_CUSTOMER") {
        message =
          "Order delivered successfully. Waiting for customer confirmation.";
      }

      res.status(200).json({
        success: true,
        message,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async confirmDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const customerId = res.locals.payload.userId;

      const order = await orderService.confirmDelivery(orderId, customerId);

      res.status(200).json({
        success: true,
        message: "Delivery confirmed successfully. Order completed.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },
};
