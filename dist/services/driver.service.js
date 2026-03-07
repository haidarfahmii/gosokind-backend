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
exports.completeDelivery = exports.acceptDelivery = exports.completePickup = exports.acceptPickup = exports.getAvailableJobs = exports.getDriverHistory = exports.getDriverActiveJob = exports.checkAvailability = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const client_1 = require("@prisma/client");
// --- PUBLIC METHODS ---
const checkAvailability = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const activeJob = yield getActiveJob(driverId);
    if (activeJob) {
        return { available: false, reason: "DRIVER_BUSY" };
    }
    return { available: true };
});
exports.checkAvailability = checkAvailability;
const getDriverActiveJob = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const job = yield getActiveJob(driverId);
    if (!job)
        return null;
    return Object.assign(Object.assign({}, job), { type: job.pickupDriverId === driverId ? "PICKUP" : "DELIVERY" });
});
exports.getDriverActiveJob = getDriverActiveJob;
const getDriverHistory = (driverId_1, page_1, limit_1, ...args_1) => __awaiter(void 0, [driverId_1, page_1, limit_1, ...args_1], void 0, function* (driverId, page, limit, sortBy = "desc", timeFilter = "all") {
    // Setup Time Filter
    let dateFilter = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (timeFilter === "today") {
        dateFilter = { gte: today };
    }
    else if (timeFilter === "3_days") {
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        dateFilter = { gte: threeDaysAgo };
    }
    else if (timeFilter === "7_days") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateFilter = { gte: sevenDaysAgo };
    }
    const [data, total] = yield prisma_config_1.default.$transaction([
        prisma_config_1.default.order.findMany({
            where: Object.assign({ OR: [
                    {
                        pickupDriverId: driverId,
                        status: { notIn: [client_1.OrderStatus.WAITING_FOR_PICKUP, client_1.OrderStatus.PICKUP_ON_THE_WAY] },
                    },
                    {
                        deliveryDriverId: driverId,
                        status: { in: [client_1.OrderStatus.RECEIVED_BY_CUSTOMER, client_1.OrderStatus.COMPLETED] },
                    },
                ], deletedAt: null }, (timeFilter !== "all" ? { updatedAt: dateFilter } : {})),
            include: {
                customer: { select: { fullName: true } },
                address: true,
                orderItems: { include: { laundryItem: true } },
            },
            orderBy: { updatedAt: sortBy },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_config_1.default.order.count({
            where: Object.assign({ OR: [
                    {
                        pickupDriverId: driverId,
                        status: { notIn: [client_1.OrderStatus.WAITING_FOR_PICKUP, client_1.OrderStatus.PICKUP_ON_THE_WAY] },
                    },
                    {
                        deliveryDriverId: driverId,
                        status: { in: [client_1.OrderStatus.RECEIVED_BY_CUSTOMER, client_1.OrderStatus.COMPLETED] },
                    },
                ], deletedAt: null }, (timeFilter !== "all" ? { updatedAt: dateFilter } : {})),
        }),
    ]);
    return {
        data: data.map(job => (Object.assign(Object.assign({}, job), { type: job.pickupDriverId === driverId ? "PICKUP" : "DELIVERY" }))),
        meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
    };
});
exports.getDriverHistory = getDriverHistory;
const getAvailableJobs = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10, sortBy = "asc", timeFilter = "all") {
    let dateFilter = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (timeFilter === "today") {
        dateFilter = { gte: today };
    }
    else if (timeFilter === "3_days") {
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        dateFilter = { gte: threeDaysAgo };
    }
    else if (timeFilter === "7_days") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateFilter = { gte: sevenDaysAgo };
    }
    const [pickups, deliveries, totalPickups, totalDeliveries] = yield prisma_config_1.default.$transaction([
        prisma_config_1.default.order.findMany({
            where: Object.assign({ status: client_1.OrderStatus.WAITING_FOR_PICKUP, pickupDriverId: null, deletedAt: null }, (timeFilter !== "all" ? { createdAt: dateFilter } : {})),
            include: {
                customer: { select: { fullName: true } },
                address: true,
                orderItems: { include: { laundryItem: true } },
            },
            orderBy: { createdAt: sortBy },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_config_1.default.order.findMany({
            where: Object.assign({ status: client_1.OrderStatus.READY_FOR_DELIVERY, deliveryDriverId: null, deletedAt: null }, (timeFilter !== "all" ? { updatedAt: dateFilter } : {})),
            include: {
                customer: { select: { fullName: true } },
                address: true,
                orderItems: { include: { laundryItem: true } },
            },
            orderBy: { updatedAt: sortBy },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_config_1.default.order.count({
            where: Object.assign({ status: client_1.OrderStatus.WAITING_FOR_PICKUP, pickupDriverId: null, deletedAt: null }, (timeFilter !== "all" ? { createdAt: dateFilter } : {})),
        }),
        prisma_config_1.default.order.count({
            where: Object.assign({ status: client_1.OrderStatus.READY_FOR_DELIVERY, deliveryDriverId: null, deletedAt: null }, (timeFilter !== "all" ? { updatedAt: dateFilter } : {})),
        }),
    ]);
    const allJobs = [
        ...pickups.map((p) => (Object.assign(Object.assign({}, p), { type: "PICKUP", customerName: p.customer.fullName, customerAddress: p.address.address }))),
        ...deliveries.map((d) => (Object.assign(Object.assign({}, d), { type: "DELIVERY", customerName: d.customer.fullName, customerAddress: d.address.address }))),
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
});
exports.getAvailableJobs = getAvailableJobs;
const acceptPickup = (driverId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureDriverIdle(driverId);
    // ATOMIC LOCK: Update hanya jika status masih WAITING dan Driver NULL
    const res = yield prisma_config_1.default.order.updateMany({
        where: {
            id: orderId,
            status: client_1.OrderStatus.WAITING_FOR_PICKUP,
            pickupDriverId: null,
            deletedAt: null,
        },
        data: {
            pickupDriverId: driverId,
            status: client_1.OrderStatus.PICKUP_ON_THE_WAY,
        },
    });
    if (res.count === 0)
        throw new Error("ORDER_UNAVAILABLE");
    return { success: true };
});
exports.acceptPickup = acceptPickup;
const completePickup = (driverId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield prisma_config_1.default.order.findFirst({
        where: {
            id: orderId,
            pickupDriverId: driverId,
            status: client_1.OrderStatus.PICKUP_ON_THE_WAY,
            deletedAt: null,
        },
    });
    if (!order)
        throw new Error("ORDER_NOT_FOUND_OR_INVALID");
    return yield prisma_config_1.default.order.update({
        where: { id: orderId },
        data: { status: client_1.OrderStatus.ARRIVED_AT_OUTLET },
    });
});
exports.completePickup = completePickup;
const acceptDelivery = (driverId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ensureDriverIdle(driverId);
    const res = yield prisma_config_1.default.order.updateMany({
        where: {
            id: orderId,
            status: client_1.OrderStatus.READY_FOR_DELIVERY,
            deliveryDriverId: null,
            deletedAt: null,
        },
        data: {
            deliveryDriverId: driverId,
            status: client_1.OrderStatus.DELIVERY_ON_THE_WAY,
        },
    });
    if (res.count === 0)
        throw new Error("ORDER_UNAVAILABLE");
    return { success: true };
});
exports.acceptDelivery = acceptDelivery;
const completeDelivery = (driverId, orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield prisma_config_1.default.order.findFirst({
        where: {
            id: orderId,
            deliveryDriverId: driverId,
            status: client_1.OrderStatus.DELIVERY_ON_THE_WAY,
            deletedAt: null,
        },
    });
    if (!order)
        throw new Error("ORDER_NOT_FOUND_OR_INVALID");
    return yield prisma_config_1.default.order.update({
        where: { id: orderId },
        data: { status: client_1.OrderStatus.RECEIVED_BY_CUSTOMER },
    });
});
exports.completeDelivery = completeDelivery;
// --- PRIVATE HELPERS ---
const getActiveJob = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_config_1.default.order.findFirst({
        where: {
            OR: [
                { pickupDriverId: driverId, status: client_1.OrderStatus.PICKUP_ON_THE_WAY },
                { deliveryDriverId: driverId, status: client_1.OrderStatus.DELIVERY_ON_THE_WAY },
            ],
            deletedAt: null,
        },
        include: {
            customer: { select: { fullName: true } },
            address: true,
            orderItems: { include: { laundryItem: true } },
        },
    });
});
const ensureDriverIdle = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const active = yield getActiveJob(driverId);
    if (active)
        throw new Error("DRIVER_BUSY");
});
