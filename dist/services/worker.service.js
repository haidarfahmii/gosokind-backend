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
exports.processStationOrder = exports.getWorkerHistory = exports.getIncomingOrders = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const client_1 = require("@prisma/client");
// --- PUBLIC METHODS ---
const getIncomingOrders = (station_1, page_1, limit_1, ...args_1) => __awaiter(void 0, [station_1, page_1, limit_1, ...args_1], void 0, function* (station, page, limit, sortBy = "asc", timeFilter = "all") {
    const targetStatus = getStatusForStation(station);
    if (!targetStatus)
        return { data: [], meta: { page, limit, total: 0, lastPage: 0 } };
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
    const [orders, total] = yield prisma_config_1.default.$transaction([
        prisma_config_1.default.order.findMany({
            where: Object.assign({ status: targetStatus, deletedAt: null }, (timeFilter !== "all" ? { updatedAt: dateFilter } : {})),
            include: {
                orderItems: {
                    include: { laundryItem: true },
                },
                customer: { select: { fullName: true, email: true } },
                bypassRequests: {
                    where: {
                        status: client_1.BypassStatus.PENDING,
                        station: station,
                    },
                    select: { id: true },
                },
            },
            orderBy: { updatedAt: sortBy },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_config_1.default.order.count({
            where: Object.assign({ status: targetStatus, deletedAt: null }, (timeFilter !== "all" ? { updatedAt: dateFilter } : {}))
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
});
exports.getIncomingOrders = getIncomingOrders;
const getWorkerHistory = (workerId_1, page_1, limit_1, ...args_1) => __awaiter(void 0, [workerId_1, page_1, limit_1, ...args_1], void 0, function* (workerId, page, limit, sortBy = "desc", timeFilter = "all") {
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
        prisma_config_1.default.orderStationProcess.findMany({
            where: {
                workerId,
                completedAt: Object.assign({ not: null }, (timeFilter !== "all" ? dateFilter : {})),
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
        prisma_config_1.default.orderStationProcess.count({
            where: {
                workerId,
                completedAt: Object.assign({ not: null }, (timeFilter !== "all" ? dateFilter : {})),
            }
        }),
    ]);
    return {
        data,
        meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
    };
});
exports.getWorkerHistory = getWorkerHistory;
const processStationOrder = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, workerId, station, items } = payload;
    // 1. Cek apakah ada bypass PENDING — jika ada, block
    const pendingBypass = yield prisma_config_1.default.bypassRequest.findFirst({
        where: {
            orderId,
            station,
            status: client_1.BypassStatus.PENDING,
        },
    });
    if (pendingBypass) {
        const err = new Error("ORDER_ON_HOLD");
        err.details = [];
        throw err;
    }
    // 2. Cek apakah sudah ada StationProcess aktif untuk worker+order+station ini
    //    Jika belum ada, buat sekarang (menandai worker mulai mengerjakan)
    let activeProcess = yield prisma_config_1.default.orderStationProcess.findFirst({
        where: {
            orderId,
            workerId,
            station,
            completedAt: null,
        },
    });
    if (!activeProcess) {
        activeProcess = yield prisma_config_1.default.orderStationProcess.create({
            data: {
                orderId,
                workerId,
                station,
                startedAt: new Date(),
            },
        });
    }
    // 3. Ambil order items dari database untuk validasi
    const dbOrderItems = yield fetchOrderItems(orderId);
    // 4. Validasi qty — jika beda, lempar QTY_MISMATCH
    //    StationProcess sudah ada, jadi bypass bisa dibuat
    validateItemQuantities(items, dbOrderItems);
    // 5. Qty cocok → selesaikan proses dan update status order
    return yield completeStationProcess(orderId, workerId, station, items, activeProcess.id);
});
exports.processStationOrder = processStationOrder;
// --- PRIVATE HELPERS ---
const getStatusForStation = (station) => {
    if (station === client_1.StationType.WASHING)
        return client_1.OrderStatus.WASHING;
    if (station === client_1.StationType.IRONING)
        return client_1.OrderStatus.IRONING;
    if (station === client_1.StationType.PACKING)
        return client_1.OrderStatus.PACKING;
    return null;
};
const fetchOrderItems = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_config_1.default.orderItem.findMany({ where: { orderId } });
});
const validateItemQuantities = (inputItems, dbItems) => {
    var _a;
    const mismatches = [];
    for (const inputItem of inputItems) {
        const dbItem = dbItems.find((oi) => oi.laundryItemId === inputItem.laundryItemId);
        if (!dbItem || dbItem.quantity !== inputItem.quantity) {
            mismatches.push({
                itemId: inputItem.laundryItemId,
                expected: (_a = dbItem === null || dbItem === void 0 ? void 0 : dbItem.quantity) !== null && _a !== void 0 ? _a : 0,
                actual: inputItem.quantity,
            });
        }
    }
    if (inputItems.length !== dbItems.length) {
        for (const dbItem of dbItems) {
            const inputItem = inputItems.find((i) => i.laundryItemId === dbItem.laundryItemId);
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
        const err = new Error("QTY_MISMATCH");
        err.details = mismatches;
        throw err;
    }
};
const determineNextStatus = (station, isPaid) => {
    if (station === client_1.StationType.WASHING)
        return client_1.OrderStatus.IRONING;
    if (station === client_1.StationType.IRONING)
        return client_1.OrderStatus.PACKING;
    if (station === client_1.StationType.PACKING) {
        return isPaid
            ? client_1.OrderStatus.READY_FOR_DELIVERY
            : client_1.OrderStatus.WAITING_FOR_PAYMENT;
    }
    return null;
};
/**
 * Menyelesaikan proses station yang sudah ada (completedAt = null),
 * menyimpan itemChecks, dan mengupdate status order.
 */
const completeStationProcess = (orderId, workerId, station, items, processId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_config_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const order = yield tx.order.findUniqueOrThrow({
            where: { id: orderId },
            select: { isPaid: true },
        });
        const nextStatus = determineNextStatus(station, order.isPaid);
        if (nextStatus) {
            yield tx.order.update({
                where: { id: orderId },
                data: { status: nextStatus },
            });
        }
        // Selesaikan proses station yang aktif (sudah dibuat di atas)
        return yield tx.orderStationProcess.update({
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
    }));
});
