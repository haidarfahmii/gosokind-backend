import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import {
  CreateOrderByCustomerInput,
  InputOrderDetails,
  OrderResponse,
} from "../../@types/order.types";
import { OrderStatus } from "@prisma/client";
import { generateOrderNumber } from "./order.helpers";
import { orderQueryService } from "./order-query.service";

export const orderCreationService = {
  async createOrderByCustomer(
    input: CreateOrderByCustomerInput,
  ): Promise<OrderResponse> {
    // validasi customer ada
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId, deletedAt: null },
    });

    if (!customer) {
      throw AppError("Customer not found", 404);
    }

    // validasi kalo alamat ada dan milik customer
    const address = await prisma.address.findUnique({
      where: {
        id: input.addressId,
        deletedAt: null,
      },
    });

    if (!address) {
      throw AppError("Address not found", 404);
    }

    if (address.customerId !== input.customerId) {
      throw AppError("Address does not belong to this customer", 400);
    }

    // validasi outlet ada dan tersedia
    const outlet = await prisma.outlet.findUnique({
      where: { id: input.outletId, deletedAt: null },
    });

    if (!outlet) {
      throw AppError("Outlet not found", 404);
    }

    if (outlet.status !== "AVAILABLE") {
      throw AppError("Outlet is not available", 400);
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // buat pesanan
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: input.customerId,
        addressId: input.addressId,
        outletId: input.outletId,
        totalWeight: null, // weight akan di input admin
        totalPrice: null,
        status: OrderStatus.WAITING_FOR_PICKUP,
      },
    });

    return orderQueryService.getOrderById(order.id, null, true);
  },

  async inputOrderDetails(
    orderId: string,
    input: InputOrderDetails,
    outletId: string,
    adminId: string,
  ): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw AppError("Order not found", 404);
    }

    // Validate outlet scope
    if (order.outletId !== outletId) {
      throw AppError(
        "Forbidden: You can only input details for orders from your outlet",
        403,
      );
    }

    // validasi status is ARRIVED_AT_OUTLET
    if (order.status !== OrderStatus.ARRIVED_AT_OUTLET) {
      throw AppError(
        "Order details can only be input when status is ARRIVED_AT_OUTLET",
        400,
      );
    }

    // Validate order doesn't already have items
    if (order.orderItems.length > 0) {
      throw AppError("Order details have already been input", 400);
    }

    // Validate total weight
    if (input.totalWeight <= 0) {
      throw AppError("Total weight must be greater than 0", 400);
    }

    // validasi semua item laundry ada
    const laundryItemIds = input.items.map((item) => item.laundryItemId);
    const laundryItems = await prisma.laundryItem.findMany({
      where: {
        id: { in: laundryItemIds },
        deletedAt: null,
      },
    });

    if (laundryItems.length !== laundryItemIds.length) {
      throw AppError("One or more laundry items not found", 404);
    }

    // Validate quantities
    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw AppError(
          `Quantity for item ${item.laundryItemId} must be greater than 0`,
          400,
        );
      }
    }

    // total kalkulasi harga dari item
    let totalPrice = 0;
    for (const item of input.items) {
      const laundryItem = laundryItems.find(
        (li) => li.id === item.laundryItemId,
      );
      if (laundryItem && laundryItem.basePrice) {
        totalPrice += laundryItem.basePrice * item.quantity;
      }
    }

    // update order dengan transaksi
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order with weight, price, and status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          totalWeight: input.totalWeight,
          totalPrice,
          status: OrderStatus.WASHING,
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: input.items.map((item) => ({
          orderId,
          laundryItemId: item.laundryItemId,
          quantity: item.quantity,
        })),
      });

      //  Buat stationProcess untuk WASHING agar worker bisa bypass
      if (input.workerId) {
        await tx.orderStationProcess.create({
          data: {
            orderId,
            station: "WASHING",
            workerId: input.workerId,
            startedAt: new Date(),
          },
        });
      }

      return updated;
    });

    return orderQueryService.getOrderById(updatedOrder.id, outletId, false);
  },
};
