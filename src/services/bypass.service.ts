import prisma from "../config/prisma.config";
import { StationType, BypassStatus } from "../generated/prisma/client";

interface CreateBypassPayload {
  orderId: string;
  workerId: string;
  station: StationType;
  reason: string;
}

export const createBypassRequest = async (payload: CreateBypassPayload) => {
  const { orderId, workerId, station, reason } = payload;

  await validateOrderExists(orderId);

  return await prisma.bypassRequest.create({
    data: {
      orderId,
      workerId,
      station,
      reason,
      status: BypassStatus.PENDING,
    },
  });
};

// --- PRIVATE HELPERS ---

const validateOrderExists = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }
};
