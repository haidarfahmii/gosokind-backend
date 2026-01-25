import { prisma } from "../lib/prisma";
import { OrderStatus } from "../generated/prisma/client";

export const checkAvailability = async (driverId: string) => {
  // Logic: Driver is available if they are NOT currently handling an ACTIVE job.
  // Active jobs for driver = PICKUP_ON_THE_WAY (as pickupDriver) OR DELIVERY_ON_THE_WAY (as deliveryDriver)
  
  const activePickup = await prisma.order.findFirst({
    where: {
      pickupDriverId: driverId,
      status: OrderStatus.PICKUP_ON_THE_WAY,
    },
  });

  if (activePickup) {
    return { available: false, reason: "Currently handling a pickup" };
  }

  const activeDelivery = await prisma.order.findFirst({
    where: {
      deliveryDriverId: driverId,
      status: OrderStatus.DELIVERY_ON_THE_WAY,
    },
  });

  if (activeDelivery) {
    return { available: false, reason: "Currently handling a delivery" };
  }

  return { available: true };
};
