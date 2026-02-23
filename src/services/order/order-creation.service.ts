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
import { geoService } from "../geo.service";

export const orderCreationService = {
  async createOrderByCustomer(customerId: string,
    input: CreateOrderByCustomerInput,
  ): Promise<OrderResponse> {
    // 1. Validate customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, deletedAt: null },
    });
    if (!customer) throw AppError("Customer not found", 404);

    // 2. Validate and get address coordinates
    const address = await prisma.address.findUnique({
      where: { id: input.addressId, deletedAt: null },
    });
    if (!address) throw AppError("Address not found", 404);
    if (address.customerId !== customerId) {
      throw AppError("Address does not belong to this customer", 400);
    }

    // 3. Find the nearest available outlet
    const availableOutlets = await prisma.outlet.findMany({
      where: { status: "AVAILABLE", deletedAt: null },
    });

    if (availableOutlets.length === 0) {
      throw AppError("No available outlets at the moment", 404);
    }

    let nearestOutlet = null;
    let shortestDistance = Infinity;

    for (const outlet of availableOutlets) {
      const distance = geoService.calculateDistance(
        address.latitude,
        address.longitude,
        outlet.latitude,
        outlet.longitude
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestOutlet = outlet;
      }
    }

    if (!nearestOutlet) {
      throw AppError("Could not determine the nearest outlet", 404);
    }

    // 4. Generate order number
    const orderNumber = await generateOrderNumber();

    // 5. Create the order with the automatically selected outletId
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customerId,
        addressId: input.addressId,
        outletId: nearestOutlet.id, // Use the nearest outlet found
        totalWeight: null,
        totalPrice: null,
        status: OrderStatus.WAITING_FOR_PICKUP,
        pickupAt: input.pickupAt ? new Date(input.pickupAt) : new Date()
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
