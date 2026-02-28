import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import {
  GetAllOrdersQuery,
  OrderResponse,
  OrderListResponse,
} from "../../@types/order.types";

export const orderQueryService = {
  // Get all orders dimana super admin bisa melihat semua order sedangkan outlet admin hanya bisa melihat order pada outletnya
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

    // Outlet scope: Outlet admin hanya bisa melihat order outletnya
    if (!isSuperAdmin && scopedOutletId) {
      where.outletId = scopedOutletId;
    } else if (isSuperAdmin && query.outletId) {
      // Super admin bisa filter by outlet
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
      pickupAt: order.pickupAt,
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

  async getOrdersByCustomer(
    customerId: string,
    query: GetAllOrdersQuery
  ): Promise<OrderListResponse> {
    const page = query.page || 1;
    const limit = query.limit || 5;
    const skip = (page - 1) * limit;

    // Filter wajib: customerId harus sesuai dengan yang login
    const where: any = {
      deletedAt: null,
      customerId: customerId,
    };

    // Filter Status (jika user memilih tab 'Selesai' atau 'Aktif')
    if (query.status) {
      where.status = query.status;
    }

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders
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

    // Format response sesuai tipe data
    const formattedOrders: OrderResponse[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalWeight: order.totalWeight,
      totalPrice: order.totalPrice,
      isPaid: order.isPaid,
      status: order.status,
      pickupAt: order.pickupAt,
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
      pickupAt: order.pickupAt,
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

  async getOrderByOrderNumber(
    orderNumber: string,
    scopedOutletId: string | null,
    isSuperAdmin: boolean,
  ): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber }, // Pastikan orderNumber memiliki atribut @unique di schema prisma Anda
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

    if (!order || order.deletedAt !== null) {
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
      pickupAt: order.pickupAt,
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
};
