import prisma from "../config/prisma.config";
import { StationType, OrderStatus } from "@prisma/client";

interface ProcessOrderPayload {
  orderId: string;
  workerId: string;
  station: StationType;
  items: { laundryItemId: string; quantity: number }[];
}

// --- PUBLIC METHODS ---

export const getIncomingOrders = async (
  station: StationType,
  page: number,
  limit: number,
) => {
  const targetStatus = getStatusForStation(station);
  if (!targetStatus)
    return { data: [], meta: { page, limit, total: 0, lastPage: 0 } };

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { status: targetStatus, deletedAt: null },
      include: {
        orderItems: { include: { laundryItem: true } },
        customer: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { status: targetStatus, deletedAt: null } }),
  ]);

  return {
    data,
    meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
  };
};

export const getWorkerHistory = async (
  workerId: string,
  page: number,
  limit: number,
) => {
  const [data, total] = await prisma.$transaction([
    prisma.orderStationProcess.findMany({
      where: { workerId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalWeight: true,
          },
        },
        itemChecks: { include: { laundryItem: true } },
      },
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.orderStationProcess.count({ where: { workerId } }),
  ]);

  return {
    data,
    meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
  };
};

export const processStationOrder = async (payload: ProcessOrderPayload) => {
  const { orderId, workerId, station, items } = payload;
  const dbOrderItems = await fetchOrderItems(orderId);

  validateItemQuantities(items, dbOrderItems);

  return await createStationProcess(orderId, workerId, station, items);
};

// --- PRIVATE HELPERS ---

const getStatusForStation = (station: StationType): OrderStatus | null => {
  if (station === StationType.WASHING) return OrderStatus.WASHING;
  if (station === StationType.IRONING) return OrderStatus.IRONING;
  if (station === StationType.PACKING) return OrderStatus.PACKING;
  return null;
};

const fetchOrderItems = async (orderId: string) => {
  return await prisma.orderItem.findMany({ where: { orderId } });
};

const validateItemQuantities = (
  inputItems: ProcessOrderPayload["items"],
  dbItems: { laundryItemId: string; quantity: number }[],
) => {
  if (inputItems.length !== dbItems.length) throw new Error("QTY_MISMATCH");

  for (const inputItem of inputItems) {
    const dbItem = dbItems.find(
      (oi) => oi.laundryItemId === inputItem.laundryItemId,
    );
    if (!dbItem || dbItem.quantity !== inputItem.quantity)
      throw new Error("QTY_MISMATCH");
  }
};

const determineNextStatus = (
  station: StationType,
  isPaid: boolean,
): OrderStatus | null => {
  if (station === StationType.WASHING) return OrderStatus.IRONING;
  if (station === StationType.IRONING) return OrderStatus.PACKING;
  if (station === StationType.PACKING) {
    return isPaid
      ? OrderStatus.READY_FOR_DELIVERY
      : OrderStatus.WAITING_FOR_PAYMENT;
  }
  return null;
};

const createStationProcess = async (
  orderId: string,
  workerId: string,
  station: StationType,
  items: ProcessOrderPayload["items"],
) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { isPaid: true },
    });

    const nextStatus = determineNextStatus(station, order.isPaid);

    if (nextStatus) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
      });
    }

    // Selesaikan proses station sebelumnya jika ada
    await tx.orderStationProcess.updateMany({
      where: { orderId, station, completedAt: null },
      data: { completedAt: new Date() },
    });

    return await tx.orderStationProcess.create({
      data: {
        orderId,
        station,
        workerId,
        completedAt: new Date(),
        itemChecks: {
          create: items.map((i) => ({
            laundryItemId: i.laundryItemId,
            inputQuantity: i.quantity,
          })),
        },
      },
      include: { itemChecks: { include: { laundryItem: true } } },
    });
  });
};
