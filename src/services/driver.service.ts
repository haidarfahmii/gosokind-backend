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

export const getAvailableJobs = async () => {
  const [pickups, deliveries] = await prisma.$transaction([
    prisma.order.findMany({
      where: {
        status: OrderStatus.WAITING_FOR_PICKUP,
        pickupDriverId: null,
        deletedAt: null,
      },
      include: {
        customer: { select: { fullName: true } },
        address: true,
        orderItems: { include: { laundryItem: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: {
        status: OrderStatus.READY_FOR_DELIVERY,
        deliveryDriverId: null,
        deletedAt: null,
      },
      include: {
        customer: { select: { fullName: true } },
        address: true,
        orderItems: { include: { laundryItem: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),
  ]);

  return [
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
