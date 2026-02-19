import prisma from "../config/prisma.config";
import { AppError } from "../utils/app-error";
import {
  CreateOrderByCustomerInput,
  InputOrderDetails,
  CreateOrderInput,
  UpdateOrderStatusInput,
  UpdateDriverStatusInput,
  CreateBypassRequestInput,
  HandleBypassRequestInput,
  GetAllOrdersQuery,
  OrderResponse,
  BypassRequestResponse,
  OrderListResponse,
} from "../@types/order.types";
import {
  OrderStatus,
  EmployeeRole,
  BypassStatus,
  StationType,
  Order,
} from "@prisma/client";

/**
 * Generate unique order number
 * Format: INV-YYYYMMXXX (e.g., INV-20250213001)
 */
async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const prefix = `INV-${year}${month}${day}`;

  // Get today's order count
  const count = await prisma.order.count({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
  });

  const sequence = String(count + 1).padStart(3, "0");
  return `${prefix}${sequence}`;
}

// Fungsi validasi transisi status diperbolehkan
function validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): void {
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    WAITING_FOR_PICKUP: [OrderStatus.PICKUP_ON_THE_WAY],
    PICKUP_ON_THE_WAY: [OrderStatus.ARRIVED_AT_OUTLET],
    ARRIVED_AT_OUTLET: [OrderStatus.WASHING],
    WASHING: [OrderStatus.IRONING],
    IRONING: [OrderStatus.PACKING],
    PACKING: [OrderStatus.WAITING_FOR_PAYMENT, OrderStatus.READY_FOR_DELIVERY],
    WAITING_FOR_PAYMENT: [OrderStatus.READY_FOR_DELIVERY],
    READY_FOR_DELIVERY: [OrderStatus.DELIVERY_ON_THE_WAY],
    DELIVERY_ON_THE_WAY: [OrderStatus.RECEIVED_BY_CUSTOMER],
    RECEIVED_BY_CUSTOMER: [OrderStatus.COMPLETED],
    COMPLETED: [],
  };

  const allowed = allowedTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw AppError(
      `Invalid status transition from ${currentStatus} to ${newStatus}`,
      400,
    );
  }
}

// Fungsi untuk mendapatkan peran pekerja yang dibutuhkan untuk status pesanan
function getRequiredWorkerRole(status: OrderStatus): EmployeeRole {
  switch (status) {
    case OrderStatus.WASHING:
      return EmployeeRole.WORKER_WASHING;
    case OrderStatus.IRONING:
      return EmployeeRole.WORKER_IRONING;
    case OrderStatus.PACKING:
      return EmployeeRole.WORKER_PACKING;
    default:
      throw AppError("Invalid status for worker role validation", 400);
  }
}

// Fungsi untuk mendapatkan jenis station dari status pesanan
function getStationType(status: OrderStatus): StationType {
  switch (status) {
    case OrderStatus.WASHING:
      return StationType.WASHING;
    case OrderStatus.IRONING:
      return StationType.IRONING;
    case OrderStatus.PACKING:
      return StationType.PACKING;
    default:
      throw AppError("Invalid status for station type", 400);
  }
}

// Fungsi untuk mendapatkan status order berikutnya setelah complete suatu station
function getNextStatus(currentStatus: OrderStatus): OrderStatus {
  const statusFlow: Record<string, OrderStatus> = {
    WASHING: OrderStatus.IRONING,
    IRONING: OrderStatus.PACKING,
    PACKING: OrderStatus.WAITING_FOR_PAYMENT,
  };

  return statusFlow[currentStatus] || currentStatus;
}

export const orderService = {
  async getAllOrders(
    query: GetAllOrdersQuery,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ): Promise<OrderListResponse> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Outlet scope: Outlet admin only sees their outlet's orders
    if (!isSuperAdmin && scopedOutletId) {
      where.outletId = scopedOutletId;
    } else if (isSuperAdmin && query.outletId) {
      // Super admin can filter by outlet
      where.outletId = query.outletId;
    }

    // Search filter (order number, customer name, customer email)
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: "insensitive" } },
        {
          customer: {
            fullName: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          customer: { email: { contains: query.search, mode: "insensitive" } },
        },
      ];
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders with relations
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        address: {
          select: {
            id: true,
            label: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        pickupDriver: {
          select: {
            id: true,
            fullName: true,
          },
        },
        deliveryDriver: {
          select: {
            id: true,
            fullName: true,
          },
        },
        orderItems: {
          include: {
            laundryItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        stationProcesses: {
          include: {
            worker: {
              select: {
                id: true,
                fullName: true,
              },
            },
            itemChecks: {
              include: {
                laundryItem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            startedAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedOrders: OrderResponse[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalWeight: order.totalWeight,
      totalPrice: order.totalPrice,
      isPaid: order.isPaid,
      status: order.status,
      customer: order.customer,
      address: order.address,
      outlet: order.outlet,
      pickupDriver: order.pickupDriver,
      deliveryDriver: order.deliveryDriver,
      orderItems: order.orderItems,
      stationProcesses: order.stationProcesses,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return {
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getOrderById(
    orderId: string,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        address: {
          select: {
            id: true,
            label: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        pickupDriver: {
          select: {
            id: true,
            fullName: true,
          },
        },
        deliveryDriver: {
          select: {
            id: true,
            fullName: true,
          },
        },
        orderItems: {
          include: {
            laundryItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        stationProcesses: {
          include: {
            worker: {
              select: {
                id: true,
                fullName: true,
              },
            },
            itemChecks: {
              include: {
                laundryItem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            startedAt: "asc",
          },
        },
      },
    });

    if (!order) {
      throw AppError("Order not found", 404);
    }

    // Validate outlet scope
    if (!isSuperAdmin && scopedOutletId && order.outletId !== scopedOutletId) {
      throw AppError(
        "Forbidden: You can only view orders from your own outlet",
        403,
      );
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      totalWeight: order.totalWeight,
      totalPrice: order.totalPrice,
      isPaid: order.isPaid,
      status: order.status,
      customer: order.customer,
      address: order.address,
      outlet: order.outlet,
      pickupDriver: order.pickupDriver,
      deliveryDriver: order.deliveryDriver,
      orderItems: order.orderItems,
      stationProcesses: order.stationProcesses,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  },

  async createOrderByCustomer(
    input: CreateOrderByCustomerInput,
  ): Promise<OrderResponse> {
    // validasi customer ada
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId, deletedAt: null },
    });

    if (!customer) throw AppError("Customer not found", 404);

    // validasi kalo alamat ada dan milik customer
    const address = await prisma.address.findUnique({
      where: {
        id: input.addressId,
        deletedAt: null,
      },
    });

    if (!address) throw AppError("Address not found", 404);
    if (address.customerId !== input.customerId)
      throw AppError("Address does not belong to this customer", 400);

    // validasi outlet ada dan tersedia
    const outlet = await prisma.outlet.findUnique({
      where: { id: input.outletId, deletedAt: null },
    });

    if (!outlet) throw AppError("Outlet not found", 404);
    if (outlet.status !== "AVAILABLE")
      throw AppError("Outlet is not available", 400);

    // generate order number
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
    return this.getOrderById(order.id, null, true);
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

    if (!order) throw AppError("Order not found", 404);

    // validasi outlet match
    if (order.outletId !== outletId)
      throw AppError("Forbidden: Order does not belong to your outlet", 403);

    // validasi status is ARRIVED_AT_OUTLET
    if (order.status !== OrderStatus.ARRIVED_AT_OUTLET)
      throw AppError(
        `Cannot input details. Order must be in ARRIVED_AT_OUTLET status. Current status: ${order.status}`,
        400,
      );

    // cek jika detail sudah di input
    if (order.totalWeight !== null || order.orderItems.length > 0)
      throw AppError(
        "Order details have already been input. Cannot input again.",
        400,
      );

    // validasi semua item laundry ada
    const laundryItemIds = input.items.map((item) => item.laundryItemId);
    const laundryItems = await prisma.laundryItem.findMany({
      where: {
        id: { in: laundryItemIds },
        deletedAt: null,
      },
    });

    if (laundryItems.length !== laundryItemIds.length)
      throw AppError("One or more laundry items not found", 404);

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

      return updated;
    });

    return this.getOrderById(updatedOrder.id, outletId, false);
  },

  // Driver update order status
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

    // Validasi apakah driver ada dan benar-benar merupakan driver.
    const driver = await prisma.employee.findUnique({
      where: { id: input.driverId, deletedAt: null },
    });

    if (!driver) throw AppError("Driver not found", 404);
    if (driver.role !== EmployeeRole.DRIVER)
      throw AppError("Employee must have DRIVER role", 403);

    // Validasi driver dari outlet yang sama
    if (order.outletId && driver.outletId !== order.outletId) {
      throw AppError(
        "Forbidden: Driver must be from the same outlet as the order",
        403,
      );
    }

    // Validate status transition is valid for driver
    const validDriverTransitions: Partial<Record<OrderStatus, OrderStatus[]>> =
      {
        WAITING_FOR_PICKUP: [OrderStatus.PICKUP_ON_THE_WAY],
        PICKUP_ON_THE_WAY: [OrderStatus.ARRIVED_AT_OUTLET],
        READY_FOR_DELIVERY: [OrderStatus.DELIVERY_ON_THE_WAY],
        DELIVERY_ON_THE_WAY: [OrderStatus.RECEIVED_BY_CUSTOMER],
      };

    const allowedStatuses = validDriverTransitions[order.status] || [];

    if (!allowedStatuses.includes(input.status)) {
      throw AppError(
        `Invalid status transition from ${order.status} to ${input.status}. Driver can only update specific statuses.`,
        400,
      );
    }

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

    return this.getOrderById(updatedOrder.id, order.outletId, false);
  },

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

    // Validasi status transaksi
    validateStatusTransition(order.status, input.status);

    // Validasi ID worker untuk status station
    const isStationStatus =
      input.status === OrderStatus.WASHING ||
      input.status === OrderStatus.IRONING ||
      input.status === OrderStatus.PACKING;

    if (isStationStatus) {
      if (!input.workerId) {
        throw AppError(
          "Worker ID is required for station statuses (WASHING, IRONING, PACKING)",
          400,
        );
      }

      // Verifikasi bahwa pekerja tersebut ada dan memiliki peran yang sesuai
      const worker = await prisma.employee.findUnique({
        where: { id: input.workerId, deletedAt: null },
      });

      if (!worker) {
        throw AppError("Worker not found", 404);
      }

      // Validasi kalo worker ada di outlet yang sama
      if (worker.outletId !== order.outletId) {
        throw AppError("Worker must be from the same outlet", 400);
      }

      // Validasi worker sesuai dengan peran station nya
      const requiredRole = getRequiredWorkerRole(input.status);
      if (worker.role !== requiredRole) {
        throw AppError(
          `Worker must have role ${requiredRole} for this status`,
          400,
        );
      }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Harus selesaikan semua proses station yang berlangsung apabila mau beralih ke status berikutnya
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

      // Buat proses stasiun baru jika memasukkan status stasiun
      const isStationStatus =
        input.status === OrderStatus.WASHING ||
        input.status === OrderStatus.IRONING ||
        input.status === OrderStatus.PACKING;

      if (isStationStatus && input.workerId) {
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

    return this.getOrderById(updatedOrder.id, scopedOutletId, isSuperAdmin);
  },

  async createBypassRequest(
    input: CreateBypassRequestInput,
    workerId: string,
    scopedOutletId: string | null,
  ): Promise<BypassRequestResponse> {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId, deletedAt: null },
      include: {
        orderItems: true,
        stationProcesses: {
          where: {
            workerId,
            station: input.station,
            completedAt: null,
          },
        },
      },
    });

    if (!order) {
      throw AppError("Order not found", 404);
    }

    // Validasi outlet scope
    if (scopedOutletId && order.outletId !== scopedOutletId) {
      throw AppError(
        "Forbidden: You can only create bypass requests for orders from your outlet",
        403,
      );
    }

    // Validasi worker bekerja di station nya
    if (order.stationProcesses.length === 0) {
      throw AppError(
        "You must be working on this order at this station to create a bypass request",
        400,
      );
    }

    const currentProcess = order.stationProcesses[0];

    // Periksa apakah ada permintaan bypass yang tertunda
    const existingBypass = await prisma.bypassRequest.findFirst({
      where: {
        orderId: input.orderId,
        workerId,
        station: input.station,
        status: BypassStatus.PENDING,
      },
    });

    if (existingBypass) {
      throw AppError(
        "You already have a pending bypass request for this order",
        400,
      );
    }

    // Verifikasi bahwa semua barang cucian ada
    const laundryItemIds = input.itemChecks.map((item) => item.laundryItemId);
    const laundryItems = await prisma.laundryItem.findMany({
      where: {
        id: { in: laundryItemIds },
        deletedAt: null,
      },
    });

    if (laundryItems.length !== laundryItemIds.length) {
      throw AppError("One or more laundry items not found", 404);
    }

    // Buat permintaan bypass dengan pemeriksaan item dalam sebuah transaksi
    const bypassRequest = await prisma.$transaction(async (tx) => {
      const bypass = await tx.bypassRequest.create({
        data: {
          orderId: input.orderId,
          workerId,
          station: input.station,
          reason: input.reason,
          status: BypassStatus.PENDING,
        },
      });

      // buat pemeriksaan item dalam proses station
      await tx.stationItemCheck.createMany({
        data: input.itemChecks.map((item) => ({
          processId: currentProcess.id,
          laundryItemId: item.laundryItemId,
          inputQuantity: item.inputQuantity,
        })),
      });

      return bypass;
    });

    const result = await prisma.bypassRequest.findUnique({
      where: { id: bypassRequest.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      id: result!.id,
      order: result!.order,
      worker: result!.worker,
      station: result!.station,
      reason: result!.reason,
      status: result!.status,
      adminNote: result!.adminNote,
      reviewedBy: result!.reviewedBy,
      createdAt: result!.createdAt,
      updatedAt: result!.updatedAt,
    };
  },

  async handleBypassRequest(
    bypassRequestId: string,
    input: HandleBypassRequestInput,
    adminId: string,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ): Promise<BypassRequestResponse> {
    const bypassRequest = await prisma.bypassRequest.findUnique({
      where: { id: bypassRequestId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            outletId: true,
            status: true,
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!bypassRequest) {
      throw AppError("Bypass request not found", 404);
    }

    // Validasi outlet scope
    if (
      !isSuperAdmin &&
      scopedOutletId &&
      bypassRequest.order.outletId !== scopedOutletId
    ) {
      throw AppError(
        "Forbidden: You can only handle bypass requests from your outlet",
        403,
      );
    }

    // Status validasi masih tertunda
    if (bypassRequest.status !== BypassStatus.PENDING) {
      throw AppError("This bypass request has already been handled", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBypass = await tx.bypassRequest.update({
        where: { id: bypassRequestId },
        data: {
          status:
            input.action === "APPROVED"
              ? BypassStatus.APPROVED
              : BypassStatus.REJECTED,
          adminNote: input.adminNote,
          reviewedBy: adminId,
        },
      });

      // Dapatkan proses stasiun saat ini untuk pesanan dan stasiun
      const currentProcess = await tx.orderStationProcess.findFirst({
        where: {
          orderId: bypassRequest.order.id,
          station: bypassRequest.station,
          completedAt: null,
        },
        include: {
          itemChecks: true,
        },
      });

      if (!currentProcess) {
        throw AppError("Active station process not found", 404);
      }

      // Jika diterima (approved), akan lanjutkan proses order ke status berikutnya
      if (input.action === "APPROVED") {
        console.log(
          `Bypass request APPROVED for order ${bypassRequest.order.orderNumber}`,
        );
        // step1: selesai proses station saat ini
        await tx.orderStationProcess.update({
          where: { id: currentProcess.id },
          data: { completedAt: new Date() },
        });
        console.log(
          `station ${bypassRequest.station} process completed for order ${bypassRequest.order.orderNumber}`,
        );

        // step2: pindah ke status berikutnya
        const currentOrderStatus = bypassRequest.order.status;
        const nextStatus = getNextStatus(currentOrderStatus);

        // akan benar pindah ke status berikutnya jika nextStatus adalah salah satu dari station statuses
        if (nextStatus !== currentOrderStatus) {
          await tx.order.update({
            where: { id: bypassRequest.order.id },
            data: { status: nextStatus },
          });
          console.log(
            `Order moved from ${currentOrderStatus} to ${nextStatus}`,
          );
        } else {
          console.log(
            `Order stays at ${currentOrderStatus} (no auto-transition)`,
          );
        }
      }

      // jika ditolak (rejected), data akan di clear untuk input ulang
      else if (input.action === "REJECTED") {
        console.log(
          `Bypass request REJECTED for order ${bypassRequest.order.orderNumber}`,
        );
        // clear semua item check dari worker
        if (currentProcess.itemChecks.length > 0) {
          await tx.stationItemCheck.deleteMany({
            where: { processId: currentProcess.id },
          });
          console.log(
            `Cleared ${currentProcess.itemChecks.length} item checks`,
          );
        }
        console.log(
          `Worker ${bypassRequest.worker.fullName} must re-input data correctly`,
        );
      }
      return updatedBypass;
    });

    return {
      id: result.id,
      order: bypassRequest.order,
      worker: bypassRequest.worker,
      station: result.station,
      reason: result.reason,
      status: result.status,
      adminNote: result.adminNote,
      reviewedBy: result.reviewedBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  },

  async getPendingBypassRequests(
    page: number = 1,
    limit: number = 10,
    outletId: string | undefined,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      status: BypassStatus.PENDING,
    };

    // Outlet scope
    if (!isSuperAdmin && scopedOutletId) {
      where.order = {
        outletId: scopedOutletId,
      };
    } else if (isSuperAdmin && outletId) {
      where.order = {
        outletId,
      };
    }

    // Get total count
    const total = await prisma.bypassRequest.count({ where });

    // Get bypass requests
    const bypassRequests = await prisma.bypassRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            outletId: true,
            outlet: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        worker: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      bypassRequests: bypassRequests.map((br) => ({
        id: br.id,
        order: {
          id: br.order.id,
          orderNumber: br.order.orderNumber,
          outlet: br.order.outlet,
        },
        worker: br.worker,
        station: br.station,
        reason: br.reason,
        status: br.status,
        adminNote: br.adminNote,
        reviewedBy: br.reviewedBy,
        createdAt: br.createdAt,
        updatedAt: br.updatedAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

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

    return this.getOrderById(updatedOrder.id, null, false);
  },
};
