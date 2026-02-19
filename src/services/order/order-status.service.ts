import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import {
  UpdateOrderStatusInput,
  UpdateDriverStatusInput,
  OrderResponse,
} from "../../@types/order.types";
import { OrderStatus, EmployeeRole } from "@prisma/client";
import {
  validateStatusTransition,
  validateDriverStatusTransition,
  getRequiredWorkerRole,
  getStationType,
  isStationStatus,
} from "./order.helpers";
import { orderQueryService } from "./order-query.service";

export const orderStatusService = {
  /**
   * Memperbarui status pesanan (untuk admin dan pekerja)
   * - Memvalidasi transisi status
   * - Menangani pembuatan proses stasiun
   * - Memvalidasi peran pekerja untuk status stasiun
   */
  async updateOrderStatus(
    orderId: string,
    input: UpdateOrderStatusInput,
    employeeId: string,
    employeeRole: EmployeeRole,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ): Promise<OrderResponse> {
    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      include: {
        stationProcesses: {
          where: { completedAt: null },
        },
      },
    });

    if (!order) {
      throw AppError("Order not found", 404);
    }

    // Validasi outlet scope
    if (!isSuperAdmin && scopedOutletId && order.outletId !== scopedOutletId) {
      throw AppError(
        "Forbidden: You can only update orders from your own outlet",
        403,
      );
    }

    // Validasi status transition
    validateStatusTransition(order.status, input.status);

    // Validasi worker ID untuk station
    const isStation = isStationStatus(input.status);

    if (isStation) {
      if (!input.workerId) {
        throw AppError(
          "Worker ID is required for station statuses (WASHING, IRONING, PACKING)",
          400,
        );
      }

      // Verifikasi bahwa pekerja tersebut ada dan memiliki peran yang sesuai.
      const worker = await prisma.employee.findUnique({
        where: { id: input.workerId, deletedAt: null },
      });

      if (!worker) {
        throw AppError("Worker not found", 404);
      }

      // Pastikan worker berasal dari outlet yang sama
      if (worker.outletId !== order.outletId) {
        throw AppError("Worker must be from the same outlet", 400);
      }

      // Verifikasi bahwa worker memiliki peran yang tepat untuk stasiun ini.
      const requiredRole = getRequiredWorkerRole(input.status);
      if (worker.role !== requiredRole) {
        throw AppError(
          `Worker must have role ${requiredRole} for this status`,
          400,
        );
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Selesaikan semua proses station yang sedang berlangsung sebelum beralih ke status berikutnya
      if (order.stationProcesses.length > 0) {
        await tx.orderStationProcess.updateMany({
          where: {
            orderId,
            completedAt: null,
          },
          data: {
            completedAt: new Date(),
          },
        });
      }

      // Buat proses station baru jika beralih ke status station.
      if (isStation && input.workerId) {
        const stationType = getStationType(input.status);
        await tx.orderStationProcess.create({
          data: {
            orderId,
            station: stationType,
            workerId: input.workerId,
            startedAt: new Date(),
          },
        });
      }

      // Update order status
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: input.status,
        },
      });
    });

    return orderQueryService.getOrderById(
      updatedOrder.id,
      scopedOutletId,
      isSuperAdmin,
    );
  },

  /**
   * Memperbarui status driver (untuk operasi driver)
   * - Hanya mengizinkan transisi status tertentu untuk sriver
   * - Assigns driver ID untuk pickup/delivery
   */
  async updateDriverStatus(
    orderId: string,
    input: UpdateDriverStatusInput,
    driverId: string,
  ): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
    });

    if (!order) {
      throw AppError("Order not found", 404);
    }

    // Verifikasi bahwa driver ada dan memiliki peran DRIVER
    const driver = await prisma.employee.findUnique({
      where: { id: input.driverId, deletedAt: null },
    });

    if (!driver) {
      throw AppError("Driver not found", 404);
    }

    if (driver.role !== EmployeeRole.DRIVER) {
      throw AppError("Employee must have DRIVER role", 403);
    }

    // Pastikan driver berasal dari outlet yang sama
    if (order.outletId && driver.outletId !== order.outletId) {
      throw AppError(
        "Forbidden: Driver must be from the same outlet as the order",
        403,
      );
    }

    // Validasi transisi status berlaku untuk driver
    validateDriverStatusTransition(order.status, input.status);

    // Prepare update data
    const updateData: any = {
      status: input.status,
    };

    // Assign driver ID based on action
    if (input.status === OrderStatus.PICKUP_ON_THE_WAY) {
      updateData.pickupDriverId = input.driverId;
      console.log(`🚗 Driver ${driver.fullName} accepted pickup`);
    } else if (input.status === OrderStatus.DELIVERY_ON_THE_WAY) {
      updateData.deliveryDriverId = input.driverId;
      console.log(`🚗 Driver ${driver.fullName} started delivery`);
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return orderQueryService.getOrderById(
      updatedOrder.id,
      order.outletId,
      false,
    );
  },

  /**
   * Confirm delivery (customer confirms receipt)
   * Precondition: Status must be RECEIVED_BY_CUSTOMER
   * Result: Status changes to COMPLETED
   */
  async confirmDelivery(
    orderId: string,
    customerId: string,
  ): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
    });

    if (!order) {
      throw AppError("Order not found", 404);
    }

    if (order.customerId !== customerId) {
      throw AppError("This order does not belong to you", 403);
    }

    if (order.status !== OrderStatus.RECEIVED_BY_CUSTOMER) {
      throw AppError(
        "Order can only be confirmed when status is RECEIVED_BY_CUSTOMER",
        400,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED },
    });

    return orderQueryService.getOrderById(updatedOrder.id, null, false);
  },
};
