import prisma from "../../config/prisma.config";
import { AppError } from "../../utils/app-error";
import { OrderStatus, EmployeeRole, StationType } from "@prisma/client";

/**
 * Mengkonversi string prefix (e.g. "INV-20250213") ke integer
 * yang digunakan sebagai advisory lock key di PostgreSQL.
 *
 * PostgreSQL pg_advisory_xact_lock menerima bigint (max 9223372036854775807).
 * Kita ambil bagian numerik dari tanggal saja (YYYYMMDD) agar aman.
 *
 * Contoh: "INV-20250213" → 20250213
 */
function getLockKeyFromPrefix(prefix: string): number {
  // Ambil bagian YYYYMMDD dari format "INV-YYYYMMDD"
  const datePart = prefix.replace("INV-", ""); // "20250213"
  const lockKey = parseInt(datePart, 10); // 20250213

  if (isNaN(lockKey)) {
    throw AppError("Failed to generate lock key for order number", 500);
  }

  return lockKey;
}

/**
 * Generate unique order number
 * Format: INV-YYYYMMDDXXX (e.g., INV-20250213001)
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const prefix = `INV-${year}${month}${day}`;

  const lockKey = getLockKeyFromPrefix(prefix);

  const orderNumber = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;
    const count = await tx.order.count({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
    });

    const sequence = String(count + 1).padStart(3, "0");
    return `${prefix}${sequence}`;
  });

  return orderNumber;
}

/**
 * Validate if status transition is allowed
 * @throws AppError if transition is invalid
 */
export function validateStatusTransition(
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

/**
 * Validate driver status transition
 * Only specific transitions are allowed for drivers
 */
export function validateDriverStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): void {
  const validDriverTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    WAITING_FOR_PICKUP: [OrderStatus.PICKUP_ON_THE_WAY],
    PICKUP_ON_THE_WAY: [OrderStatus.ARRIVED_AT_OUTLET],
    READY_FOR_DELIVERY: [OrderStatus.DELIVERY_ON_THE_WAY],
    DELIVERY_ON_THE_WAY: [OrderStatus.RECEIVED_BY_CUSTOMER],
  };

  const allowedStatuses = validDriverTransitions[currentStatus] || [];

  if (!allowedStatuses.includes(newStatus)) {
    throw AppError(
      `Invalid status transition from ${currentStatus} to ${newStatus}. Driver can only update specific statuses.`,
      400,
    );
  }
}

// Get required worker role for a station status
export function getRequiredWorkerRole(status: OrderStatus): EmployeeRole {
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

// Get station type from order status
export function getStationType(status: OrderStatus): StationType {
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

// Get next status after completing a station
export function getNextStatus(currentStatus: OrderStatus): OrderStatus {
  const statusFlow: Record<string, OrderStatus> = {
    WASHING: OrderStatus.IRONING,
    IRONING: OrderStatus.PACKING,
    PACKING: OrderStatus.WAITING_FOR_PAYMENT,
  };

  return statusFlow[currentStatus] || currentStatus;
}

// Check if status is a station status (WASHING, IRONING, PACKING)
export function isStationStatus(status: OrderStatus): boolean {
  return (
    status === OrderStatus.WASHING ||
    status === OrderStatus.IRONING ||
    status === OrderStatus.PACKING
  );
}

// Check if status is a driver-related status
export function isDriverStatus(status: OrderStatus): boolean {
  return (
    status === OrderStatus.WAITING_FOR_PICKUP ||
    status === OrderStatus.PICKUP_ON_THE_WAY ||
    status === OrderStatus.ARRIVED_AT_OUTLET ||
    status === OrderStatus.READY_FOR_DELIVERY ||
    status === OrderStatus.DELIVERY_ON_THE_WAY ||
    status === OrderStatus.RECEIVED_BY_CUSTOMER
  );
}

// Get human-readable status message
export function getStatusMessage(status: OrderStatus): string {
  const messages: Record<OrderStatus, string> = {
    WAITING_FOR_PICKUP: "Waiting for driver to pickup your laundry",
    PICKUP_ON_THE_WAY: "Driver is on the way to pick up your laundry",
    ARRIVED_AT_OUTLET: "Laundry arrived at outlet, waiting for processing",
    WASHING: "Your laundry is being washed",
    IRONING: "Your laundry is being ironed",
    PACKING: "Your laundry is being packed",
    WAITING_FOR_PAYMENT: "Waiting for payment",
    READY_FOR_DELIVERY: "Ready for delivery",
    DELIVERY_ON_THE_WAY: "Driver is delivering your laundry",
    RECEIVED_BY_CUSTOMER: "Laundry delivered, waiting for confirmation",
    COMPLETED: "Order completed",
  };

  return messages[status] || "Unknown status";
}
