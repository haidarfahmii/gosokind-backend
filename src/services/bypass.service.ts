import prisma from "../config/prisma.config";
import { StationType, BypassStatus } from "@prisma/client";

interface CreateBypassPayload {
  orderId: string;
  workerId: string;
  station: StationType;
  reason: string;
}

export const createBypassRequest = async (payload: CreateBypassPayload) => {
  const { orderId, workerId, station, reason } = payload;

  // Validasi order ada
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");

  // Cek apakah sudah ada pending bypass untuk kombinasi order + worker + station
  // Mencegah duplicate submission
  const existing = await prisma.bypassRequest.findFirst({
    where: {
      orderId,
      workerId,
      station,
      status: BypassStatus.PENDING,
    },
  });

  if (existing) throw new Error("ALREADY_HAS_PENDING_BYPASS");

  // Buat bypass request
  const bypassRequest = await prisma.bypassRequest.create({
    data: {
      orderId,
      workerId,
      station,
      reason,
      status: BypassStatus.PENDING,
    },
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

  return bypassRequest;
};
