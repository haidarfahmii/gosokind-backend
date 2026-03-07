import prisma from "../config/prisma.config";
import { StationType, OrderStatus, BypassStatus } from "@prisma/client";

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
  sortBy: "asc" | "desc" = "asc",
  timeFilter: "all" | "today" | "3_days" | "7_days" = "all",
) => {
  const targetStatus = getStatusForStation(station);
  if (!targetStatus)
    return { data: [], meta: { page, limit, total: 0, lastPage: 0 } };

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

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { 
        status: targetStatus, 
        deletedAt: null,
        ...(timeFilter !== "all" ? { updatedAt: dateFilter } : {}),
      },
      include: {
        orderItems: {
          include: { laundryItem: true },
        },
        customer: { select: { fullName: true, email: true } },
        bypassRequests: {
          where: {
            status: BypassStatus.PENDING,
            station: station,
          },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: sortBy },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ 
      where: { 
        status: targetStatus, 
        deletedAt: null,
        ...(timeFilter !== "all" ? { updatedAt: dateFilter } : {}),
      } 
    }),
  ]);

  const data = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    hasPendingBypass: order.bypassRequests.length > 0,
    orderItems: order.orderItems,
    customer: order.customer,
  }));

  return {
    data,
    meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
  };
};

export const getWorkerHistory = async (
  workerId: string,
  page: number,
  limit: number,
  sortBy: "asc" | "desc" = "desc",
  timeFilter: "all" | "today" | "3_days" | "7_days" = "all",
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

  const [data, total] = await prisma.$transaction([
    prisma.orderStationProcess.findMany({
      where: { 
        workerId,
        completedAt: { not: null, ...(timeFilter !== "all" ? dateFilter : {}) },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            orderItems: {
              include: {
                laundryItem: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { completedAt: sortBy },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.orderStationProcess.count({ 
      where: { 
        workerId,
        completedAt: { not: null, ...(timeFilter !== "all" ? dateFilter : {}) },
      } 
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
  };
};

export const processStationOrder = async (payload: ProcessOrderPayload) => {
  const { orderId, workerId, station, items } = payload;

  // 1. Cek apakah ada bypass PENDING — jika ada, block
  const pendingBypass = await prisma.bypassRequest.findFirst({
    where: {
      orderId,
      station,
      status: BypassStatus.PENDING,
    },
  });

  if (pendingBypass) {
    const err: any = new Error("ORDER_ON_HOLD");
    err.details = [];
    throw err;
  }

  // 2. Cek apakah sudah ada StationProcess aktif untuk worker+order+station ini
  //    Jika belum ada, buat sekarang (menandai worker mulai mengerjakan)
  let activeProcess = await prisma.orderStationProcess.findFirst({
    where: {
      orderId,
      workerId,
      station,
      completedAt: null,
    },
  });

  if (!activeProcess) {
    activeProcess = await prisma.orderStationProcess.create({
      data: {
        orderId,
        workerId,
        station,
        startedAt: new Date(),
      },
    });
  }

  // 3. Ambil order items dari database untuk validasi
  const dbOrderItems = await fetchOrderItems(orderId);

  // 4. Validasi qty — jika beda, lempar QTY_MISMATCH
  //    StationProcess sudah ada, jadi bypass bisa dibuat
  validateItemQuantities(items, dbOrderItems);

  // 5. Qty cocok → selesaikan proses dan update status order
  return await completeStationProcess(
    orderId,
    workerId,
    station,
    items,
    activeProcess.id,
  );
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
  const mismatches: { itemId: string; expected: number; actual: number }[] = [];

  for (const inputItem of inputItems) {
    const dbItem = dbItems.find(
      (oi) => oi.laundryItemId === inputItem.laundryItemId,
    );
    if (!dbItem || dbItem.quantity !== inputItem.quantity) {
      mismatches.push({
        itemId: inputItem.laundryItemId,
        expected: dbItem?.quantity ?? 0,
        actual: inputItem.quantity,
      });
    }
  }

  if (inputItems.length !== dbItems.length) {
    for (const dbItem of dbItems) {
      const inputItem = inputItems.find(
        (i) => i.laundryItemId === dbItem.laundryItemId,
      );
      if (!inputItem) {
        mismatches.push({
          itemId: dbItem.laundryItemId,
          expected: dbItem.quantity,
          actual: 0,
        });
      }
    }
  }

  if (mismatches.length > 0) {
    const err: any = new Error("QTY_MISMATCH");
    err.details = mismatches;
    throw err;
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

/**
 * Menyelesaikan proses station yang sudah ada (completedAt = null),
 * menyimpan itemChecks, dan mengupdate status order.
 */
const completeStationProcess = async (
  orderId: string,
  workerId: string,
  station: StationType,
  items: ProcessOrderPayload["items"],
  processId: string,
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

    // Selesaikan proses station yang aktif (sudah dibuat di atas)
    return await tx.orderStationProcess.update({
      where: { id: processId },
      data: {
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
