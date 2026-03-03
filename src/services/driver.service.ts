import prisma from "../config/prisma.config";
import { OrderStatus } from "@prisma/client";

// --- PUBLIC METHODS ---

export const checkAvailability = async (driverId: string) => {
  const activeJob = await getActiveJob(driverId);
  if (activeJob) {
    return { available: false, reason: "DRIVER_BUSY" };
  }
  return { available: true };
};

export const getDriverActiveJob = async (driverId: string) => {
  const job = await getActiveJob(driverId);
  if (!job) return null;

  return {
    ...job,
    type: job.pickupDriverId === driverId ? "PICKUP" : "DELIVERY",
  };
};

export const getDriverHistory = async (
  driverId: string,
  page: number,
  limit: number,
  sortBy: "asc" | "desc" = "desc",
  timeFilter: "all" | "today" | "3_days" | "7_days" = "all",
) => {
  // Setup Time Filter
  let dateFilter = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (timeFilter === "today") {
    dateFilter = { gte: today };
  } else if (timeFilter === "3_days") {
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    dateFilter = { gte: threeDaysAgo };
  } else if (timeFilter === "7_days") {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    dateFilter = { gte: sevenDaysAgo };
  }

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: {
        OR: [
          {
            pickupDriverId: driverId,
            status: { notIn: [OrderStatus.WAITING_FOR_PICKUP, OrderStatus.PICKUP_ON_THE_WAY] },
          },
          {
            deliveryDriverId: driverId,
            status: { in: [OrderStatus.RECEIVED_BY_CUSTOMER, OrderStatus.COMPLETED] },
          },
        ],
        deletedAt: null,
        ...(timeFilter !== "all" ? { updatedAt: dateFilter } : {}),
      },
      include: {
        customer: { select: { fullName: true } },
        address: true,
        orderItems: { include: { laundryItem: true } },
      },
      orderBy: { updatedAt: sortBy },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({
      where: {
        OR: [
          {
            pickupDriverId: driverId,
            status: { notIn: [OrderStatus.WAITING_FOR_PICKUP, OrderStatus.PICKUP_ON_THE_WAY] },
          },
          {
            deliveryDriverId: driverId,
            status: { in: [OrderStatus.RECEIVED_BY_CUSTOMER, OrderStatus.COMPLETED] },
          },
        ],
        deletedAt: null,
        ...(timeFilter !== "all" ? { updatedAt: dateFilter } : {}),
      },
    }),
  ]);

  return {
    data: data.map(job => ({
      ...job,
      type: job.pickupDriverId === driverId ? "PICKUP" : "DELIVERY",
    })),
    meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
  };
};

export const getAvailableJobs = async (
  page: number = 1,
  limit: number = 10,
  sortBy: "asc" | "desc" = "asc",
  timeFilter: "all" | "today" | "3_days" | "7_days" = "all"
) => {
  let dateFilter = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (timeFilter === "today") {
    dateFilter = { gte: today };
  } else if (timeFilter === "3_days") {
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    dateFilter = { gte: threeDaysAgo };
  } else if (timeFilter === "7_days") {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    dateFilter = { gte: sevenDaysAgo };
  }

  const [pickups, deliveries, totalPickups, totalDeliveries] = await prisma.$transaction([
    prisma.order.findMany({
      where: {
        status: OrderStatus.WAITING_FOR_PICKUP,
        pickupDriverId: null,
        deletedAt: null,
        ...(timeFilter !== "all" ? { createdAt: dateFilter } : {}),
      },
      include: {
        customer: { select: { fullName: true } },
        address: true,
        orderItems: { include: { laundryItem: true } },
      },
      orderBy: { createdAt: sortBy },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.findMany({
      where: {
        status: OrderStatus.READY_FOR_DELIVERY,
        deliveryDriverId: null,
        deletedAt: null,
        ...(timeFilter !== "all" ? { updatedAt: dateFilter } : {}),
      },
      include: {
        customer: { select: { fullName: true } },
        address: true,
        orderItems: { include: { laundryItem: true } },
      },
      orderBy: { updatedAt: sortBy },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({
      where: {
        status: OrderStatus.WAITING_FOR_PICKUP,
        pickupDriverId: null,
        deletedAt: null,
        ...(timeFilter !== "all" ? { createdAt: dateFilter } : {}),
      },
    }),
    prisma.order.count({
      where: {
        status: OrderStatus.READY_FOR_DELIVERY,
        deliveryDriverId: null,
        deletedAt: null,
        ...(timeFilter !== "all" ? { updatedAt: dateFilter } : {}),
      },
    }),
  ]);

  const allJobs = [
    ...pickups.map((p) => ({
      ...p,
      type: "PICKUP",
      customerName: p.customer.fullName,
      customerAddress: p.address.address,
    })),
    ...deliveries.map((d) => ({
      ...d,
      type: "DELIVERY",
      customerName: d.customer.fullName,
      customerAddress: d.address.address,
    })),
  ];
  
  // Re-sort the combined array manually to ensure "sortBy" correctly mixes pickup vs delivery times globally
  allJobs.sort((a, b) => {
    const timeA = new Date(a.type === "PICKUP" ? a.createdAt : a.updatedAt).getTime();
    const timeB = new Date(b.type === "PICKUP" ? b.createdAt : b.updatedAt).getTime();
    return sortBy === "asc" ? timeA - timeB : timeB - timeA;
  });

  // Apply manual array pagination slices since we combined two separate queries into one pool
  const slicedJobs = allJobs.slice(0, limit); // In a perfect scalable app we should do a UNION query, but this works for standard bounds
  const total = totalPickups + totalDeliveries; // Approximated total

  return {
    data: slicedJobs,
    meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
  };
};

export const acceptPickup = async (driverId: string, orderId: string) => {
  await ensureDriverIdle(driverId);

  // ATOMIC LOCK: Update hanya jika status masih WAITING dan Driver NULL
  const res = await prisma.order.updateMany({
    where: {
      id: orderId,
      status: OrderStatus.WAITING_FOR_PICKUP,
      pickupDriverId: null,
      deletedAt: null,
    },
    data: {
      pickupDriverId: driverId,
      status: OrderStatus.PICKUP_ON_THE_WAY,
    },
  });

  if (res.count === 0) throw new Error("ORDER_UNAVAILABLE");
  return { success: true };
};

export const completePickup = async (driverId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      pickupDriverId: driverId,
      status: OrderStatus.PICKUP_ON_THE_WAY,
      deletedAt: null,
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND_OR_INVALID");

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.ARRIVED_AT_OUTLET },
  });
};

export const acceptDelivery = async (driverId: string, orderId: string) => {
  await ensureDriverIdle(driverId);

  const res = await prisma.order.updateMany({
    where: {
      id: orderId,
      status: OrderStatus.READY_FOR_DELIVERY,
      deliveryDriverId: null,
      deletedAt: null,
    },
    data: {
      deliveryDriverId: driverId,
      status: OrderStatus.DELIVERY_ON_THE_WAY,
    },
  });

  if (res.count === 0) throw new Error("ORDER_UNAVAILABLE");
  return { success: true };
};

export const completeDelivery = async (driverId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      deliveryDriverId: driverId,
      status: OrderStatus.DELIVERY_ON_THE_WAY,
      deletedAt: null,
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND_OR_INVALID");

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.RECEIVED_BY_CUSTOMER },
  });
};

// --- PRIVATE HELPERS ---

const getActiveJob = async (driverId: string) => {
  return await prisma.order.findFirst({
    where: {
      OR: [
        { pickupDriverId: driverId, status: OrderStatus.PICKUP_ON_THE_WAY },
        { deliveryDriverId: driverId, status: OrderStatus.DELIVERY_ON_THE_WAY },
      ],
      deletedAt: null,
    },
    include: {
      customer: { select: { fullName: true } },
      address: true,
      orderItems: { include: { laundryItem: true } },
    },
  });
};

const ensureDriverIdle = async (driverId: string) => {
  const active = await getActiveJob(driverId);
  if (active) throw new Error("DRIVER_BUSY");
};
