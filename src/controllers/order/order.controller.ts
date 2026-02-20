import { Request, Response, NextFunction } from "express";
import { orderService } from "../../services/order/order.service";
import {
  CreateOrderByCustomerInput,
  InputOrderDetails,
  GetAllOrdersQuery,
} from "../../@types/order.types";

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

      if (!input.workerId) {
        return res.status(400).json({
          success: false,
          message: "workerId is required to assign washing station worker",
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
};
