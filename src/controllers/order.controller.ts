import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import {
  CreateOrderByCustomerInput,
  InputOrderDetails,
  UpdateDriverStatusInput,
  UpdateOrderStatusInput,
  CreateBypassRequestInput,
  HandleBypassRequestInput,
  GetAllOrdersQuery,
} from "../@types/order.types";

export const orderController = {
  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const query: GetAllOrdersQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
        search: req.query.search as string | undefined,
        status: req.query.status as any,
        outletId: req.query.outletId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const scopedOutletId = res.locals.scopedOutletId;
      const isSuperAdmin = res.locals.isSuperAdmin;

      const result = await orderService.getAllOrders(
        query,
        scopedOutletId,
        isSuperAdmin,
      );

      res.status(200).json({
        success: true,
        message: "Orders retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const scopedOutletId = res.locals.scopedOutletId;
      const isSuperAdmin = res.locals.isSuperAdmin;

      const order = await orderService.getOrderById(
        orderId,
        scopedOutletId,
        isSuperAdmin,
      );

      res.status(200).json({
        success: true,
        message: "Order retrieved successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

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
        message: "Order status updated successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async createBypassRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id;
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

  async createOrderByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateOrderByCustomerInput = req.body;
      const customerId = res.locals.payload.userId;

      if (input.customerId !== customerId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only create orders for yourself",
          data: null,
        });
      }

      const order = await orderService.createOrderByCustomer(input);

      res.status(201).json({
        success: true,
        message: "Order created successfully. Waiting for driver pickup.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async inputOrderDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id as string;
      const input: InputOrderDetails = req.body;
      const outletId = res.locals.scopedOutletId;
      const adminId = res.locals.payload.userId;

      // Ensure admin is assigned to an outlet
      if (!outletId) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: You must be assigned to an outlet to input order details",
          data: null,
        });
      }

      const order = await orderService.inputOrderDetails(
        orderId,
        input,
        outletId,
        adminId,
      );

      res.status(200).json({
        success: true,
        message:
          "Order details input successfully. Order moved to WASHING station.",
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
        message: "Delivery confirmed successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },
};
