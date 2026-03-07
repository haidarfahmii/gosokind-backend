"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderNumber = generateOrderNumber;
exports.validateStatusTransition = validateStatusTransition;
exports.validateDriverStatusTransition = validateDriverStatusTransition;
exports.getRequiredWorkerRole = getRequiredWorkerRole;
exports.getStationType = getStationType;
exports.getNextStatus = getNextStatus;
exports.isStationStatus = isStationStatus;
exports.isDriverStatus = isDriverStatus;
exports.getStatusMessage = getStatusMessage;
const prisma_config_1 = __importDefault(require("../../config/prisma.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
/**
 * Mengkonversi string prefix (e.g. "INV-20250213") ke integer
 * yang digunakan sebagai advisory lock key di PostgreSQL.
 *
 * PostgreSQL pg_advisory_xact_lock menerima bigint (max 9223372036854775807).
 * Kita ambil bagian numerik dari tanggal saja (YYYYMMDD) agar aman.
 *
 * Contoh: "INV-20250213" → 20250213
 */
function getLockKeyFromPrefix(prefix) {
    // Ambil bagian YYYYMMDD dari format "INV-YYYYMMDD"
    const datePart = prefix.replace("INV-", ""); // "20250213"
    const lockKey = parseInt(datePart, 10); // 20250213
    if (isNaN(lockKey)) {
        throw (0, app_error_1.AppError)("Failed to generate lock key for order number", 500);
    }
    return lockKey;
}
/**
 * Generate unique order number
 * Format: INV-YYYYMMDDXXX (e.g., INV-20250213001)
 */
function generateOrderNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const prefix = `INV-${year}${month}${day}`;
        const lockKey = getLockKeyFromPrefix(prefix);
        const orderNumber = yield prisma_config_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
            yield tx.$executeRaw `SELECT pg_advisory_xact_lock(${lockKey})`;
            const count = yield tx.order.count({
                where: {
                    orderNumber: {
                        startsWith: prefix,
                    },
                },
            });
            const sequence = String(count + 1).padStart(3, "0");
            return `${prefix}${sequence}`;
        }));
        return orderNumber;
    });
}
/**
 * Validate if status transition is allowed
 * @throws AppError if transition is invalid
 */
function validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
        SCHEDULED_FOR_PICKUP: [client_1.OrderStatus.SCHEDULED_FOR_PICKUP],
        WAITING_FOR_PICKUP: [client_1.OrderStatus.PICKUP_ON_THE_WAY],
        PICKUP_ON_THE_WAY: [client_1.OrderStatus.ARRIVED_AT_OUTLET],
        ARRIVED_AT_OUTLET: [client_1.OrderStatus.WASHING],
        WASHING: [client_1.OrderStatus.IRONING],
        IRONING: [client_1.OrderStatus.PACKING],
        PACKING: [client_1.OrderStatus.WAITING_FOR_PAYMENT, client_1.OrderStatus.READY_FOR_DELIVERY],
        WAITING_FOR_PAYMENT: [client_1.OrderStatus.READY_FOR_DELIVERY],
        READY_FOR_DELIVERY: [client_1.OrderStatus.DELIVERY_ON_THE_WAY],
        DELIVERY_ON_THE_WAY: [client_1.OrderStatus.RECEIVED_BY_CUSTOMER],
        RECEIVED_BY_CUSTOMER: [client_1.OrderStatus.COMPLETED],
        COMPLETED: [],
    };
    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
        throw (0, app_error_1.AppError)(`Invalid status transition from ${currentStatus} to ${newStatus}`, 400);
    }
}
/**
 * Validate driver status transition
 * Only specific transitions are allowed for drivers
 */
function validateDriverStatusTransition(currentStatus, newStatus) {
    const validDriverTransitions = {
        WAITING_FOR_PICKUP: [client_1.OrderStatus.PICKUP_ON_THE_WAY],
        PICKUP_ON_THE_WAY: [client_1.OrderStatus.ARRIVED_AT_OUTLET],
        READY_FOR_DELIVERY: [client_1.OrderStatus.DELIVERY_ON_THE_WAY],
        DELIVERY_ON_THE_WAY: [client_1.OrderStatus.RECEIVED_BY_CUSTOMER],
    };
    const allowedStatuses = validDriverTransitions[currentStatus] || [];
    if (!allowedStatuses.includes(newStatus)) {
        throw (0, app_error_1.AppError)(`Invalid status transition from ${currentStatus} to ${newStatus}. Driver can only update specific statuses.`, 400);
    }
}
// Get required worker role for a station status
function getRequiredWorkerRole(status) {
    switch (status) {
        case client_1.OrderStatus.WASHING:
            return client_1.EmployeeRole.WORKER_WASHING;
        case client_1.OrderStatus.IRONING:
            return client_1.EmployeeRole.WORKER_IRONING;
        case client_1.OrderStatus.PACKING:
            return client_1.EmployeeRole.WORKER_PACKING;
        default:
            throw (0, app_error_1.AppError)("Invalid status for worker role validation", 400);
    }
}
// Get station type from order status
function getStationType(status) {
    switch (status) {
        case client_1.OrderStatus.WASHING:
            return client_1.StationType.WASHING;
        case client_1.OrderStatus.IRONING:
            return client_1.StationType.IRONING;
        case client_1.OrderStatus.PACKING:
            return client_1.StationType.PACKING;
        default:
            throw (0, app_error_1.AppError)("Invalid status for station type", 400);
    }
}
// Get next status after completing a station
function getNextStatus(currentStatus) {
    const statusFlow = {
        WASHING: client_1.OrderStatus.IRONING,
        IRONING: client_1.OrderStatus.PACKING,
        PACKING: client_1.OrderStatus.WAITING_FOR_PAYMENT,
    };
    return statusFlow[currentStatus] || currentStatus;
}
// Check if status is a station status (WASHING, IRONING, PACKING)
function isStationStatus(status) {
    return (status === client_1.OrderStatus.WASHING ||
        status === client_1.OrderStatus.IRONING ||
        status === client_1.OrderStatus.PACKING);
}
// Check if status is a driver-related status
function isDriverStatus(status) {
    return (status === client_1.OrderStatus.WAITING_FOR_PICKUP ||
        status === client_1.OrderStatus.PICKUP_ON_THE_WAY ||
        status === client_1.OrderStatus.ARRIVED_AT_OUTLET ||
        status === client_1.OrderStatus.READY_FOR_DELIVERY ||
        status === client_1.OrderStatus.DELIVERY_ON_THE_WAY ||
        status === client_1.OrderStatus.RECEIVED_BY_CUSTOMER);
}
// Get human-readable status message
function getStatusMessage(status) {
    const messages = {
        SCHEDULED_FOR_PICKUP: "Waiting for the scheduled pickup",
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
