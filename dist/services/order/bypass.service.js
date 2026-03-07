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
exports.bypassService = void 0;
const prisma_config_1 = __importDefault(require("../../config/prisma.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
const order_helpers_1 = require("./order.helpers");
exports.bypassService = {
    // Membuat bypass request dimana worker membuat request ketika item tidak match
    createBypassRequest(input, workerId, scopedOutletId) {
        return __awaiter(this, void 0, void 0, function* () {
            const worker = yield prisma_config_1.default.employee.findUnique({
                where: { id: workerId, deletedAt: null },
                select: { id: true, outletId: true, role: true },
            });
            if (!worker) {
                throw (0, app_error_1.AppError)("Worker not found", 404);
            }
            const order = yield prisma_config_1.default.order.findUnique({
                where: { id: input.orderId, deletedAt: null },
                include: {
                    orderItems: true,
                    stationProcesses: {
                        where: {
                            workerId,
                            station: input.station,
                            completedAt: null,
                        },
                    },
                },
            });
            if (!order)
                throw (0, app_error_1.AppError)("Order not found", 404);
            // Validasi outlet scope
            if (scopedOutletId && order.outletId !== scopedOutletId) {
                throw (0, app_error_1.AppError)("Forbidden: You can only create bypass requests for orders from your outlet", 403);
            }
            // validasi worker bekerja di station nya
            if (order.stationProcesses.length === 0) {
                throw (0, app_error_1.AppError)("You must be working on this order at this station to create a bypass request", 400);
            }
            const currentProcess = order.stationProcesses[0];
            // Periksa apakah ada permintaan bypass yang tertunda
            const existingBypass = yield prisma_config_1.default.bypassRequest.findFirst({
                where: {
                    orderId: input.orderId,
                    workerId,
                    station: input.station,
                    status: client_1.BypassStatus.PENDING,
                },
            });
            if (existingBypass) {
                throw (0, app_error_1.AppError)("You already have a pending bypass request for this order", 400);
            }
            // Verifikasi bahwa semua barang laundry ada
            const laundryItemIds = input.itemChecks.map((item) => item.laundryItemId);
            const laundryItems = yield prisma_config_1.default.laundryItem.findMany({
                where: {
                    id: { in: laundryItemIds },
                    deletedAt: null,
                },
            });
            if (laundryItems.length !== laundryItemIds.length) {
                throw (0, app_error_1.AppError)("One or more laundry items not found", 404);
            }
            // Buat permintaan bypass dengan pemeriksaan item dalam sebuah transaksi
            const bypassRequest = yield prisma_config_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const bypass = yield tx.bypassRequest.create({
                    data: {
                        orderId: input.orderId,
                        workerId,
                        station: input.station,
                        reason: input.reason,
                        status: client_1.BypassStatus.PENDING,
                    },
                });
                // buat pemeriksaan item dalam proses station
                yield tx.stationItemCheck.createMany({
                    data: input.itemChecks.map((item) => ({
                        processId: currentProcess.id,
                        laundryItemId: item.laundryItemId,
                        inputQuantity: item.inputQuantity,
                    })),
                });
                return bypass;
            }));
            const result = yield prisma_config_1.default.bypassRequest.findUnique({
                where: { id: bypassRequest.id },
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
            return {
                id: result.id,
                order: result.order,
                worker: result.worker,
                station: result.station,
                reason: result.reason,
                status: result.status,
                adminNote: result.adminNote,
                reviewedBy: result.reviewedBy,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
            };
        });
    },
    // Handle bypass req dimana admin bisa approve/reject req
    handleBypassRequest(bypassRequestId, input, adminId, scopedOutletId, isSuperAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            const bypassRequest = yield prisma_config_1.default.bypassRequest.findUnique({
                where: { id: bypassRequestId },
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            outletId: true,
                            status: true,
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
            if (!bypassRequest) {
                throw (0, app_error_1.AppError)("Bypass request not found", 404);
            }
            // Validasi outlet scope
            if (!isSuperAdmin &&
                scopedOutletId &&
                bypassRequest.order.outletId !== scopedOutletId) {
                throw (0, app_error_1.AppError)("Forbidden: You can only handle bypass requests from your outlet", 403);
            }
            // Status validasi masih tertunda
            if (bypassRequest.status !== client_1.BypassStatus.PENDING) {
                throw (0, app_error_1.AppError)("This bypass request has already been handled", 400);
            }
            const result = yield prisma_config_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const updatedBypass = yield tx.bypassRequest.update({
                    where: { id: bypassRequestId },
                    data: {
                        status: input.action === "APPROVED"
                            ? client_1.BypassStatus.APPROVED
                            : client_1.BypassStatus.REJECTED,
                        adminNote: input.adminNote,
                        reviewedBy: adminId,
                    },
                });
                // Dapatkan proses stasiun saat ini untuk pesanan dan stasiun
                const currentProcess = yield tx.orderStationProcess.findFirst({
                    where: {
                        orderId: bypassRequest.order.id,
                        station: bypassRequest.station,
                        completedAt: null,
                    },
                    include: {
                        itemChecks: true,
                    },
                });
                if (!currentProcess) {
                    throw (0, app_error_1.AppError)("Active station process not found", 404);
                }
                // Jika diterima (approved), akan lanjutkan proses order ke status berikutnya
                if (input.action === "APPROVED") {
                    console.log(`Bypass request APPROVED for order ${bypassRequest.order.orderNumber}`);
                    // step1: selesai proses station saat ini
                    yield tx.orderStationProcess.update({
                        where: { id: currentProcess.id },
                        data: { completedAt: new Date() },
                    });
                    console.log(`Station ${bypassRequest.station} process completed for order ${bypassRequest.order.orderNumber}`);
                    // step2: pindah ke status berikutnya
                    const currentOrderStatus = bypassRequest.order.status;
                    const nextStatus = (0, order_helpers_1.getNextStatus)(currentOrderStatus);
                    // akan benar pindah ke status berikutnya jika nextStatus adalah salah satu dari station statuses
                    if (nextStatus !== currentOrderStatus) {
                        yield tx.order.update({
                            where: { id: bypassRequest.order.id },
                            data: { status: nextStatus },
                        });
                        console.log(`Order moved from ${currentOrderStatus} to ${nextStatus}`);
                    }
                    else {
                        console.log(`Order stays at ${currentOrderStatus} (no auto-transition)`);
                    }
                }
                // jika ditolak (rejected), data akan di clear untuk input ulang
                else if (input.action === "REJECTED") {
                    console.log(`Bypass request REJECTED for order ${bypassRequest.order.orderNumber}`);
                    // clear semua item check dari worker
                    if (currentProcess.itemChecks.length > 0) {
                        yield tx.stationItemCheck.deleteMany({
                            where: { processId: currentProcess.id },
                        });
                        console.log(`Cleared ${currentProcess.itemChecks.length} item checks`);
                    }
                    console.log(`Worker ${bypassRequest.worker.fullName} must re-input data correctly`);
                }
                return updatedBypass;
            }));
            return {
                id: result.id,
                order: bypassRequest.order,
                worker: bypassRequest.worker,
                station: result.station,
                reason: result.reason,
                status: result.status,
                adminNote: result.adminNote,
                reviewedBy: result.reviewedBy,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
            };
        });
    },
    // untuk melihat pending request
    getPendingBypassRequests() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, outletId, scopedOutletId, isSuperAdmin) {
            const skip = (page - 1) * limit;
            const where = {
                status: client_1.BypassStatus.PENDING,
            };
            // Outlet scope
            if (!isSuperAdmin && scopedOutletId) {
                where.order = {
                    outletId: scopedOutletId,
                };
            }
            else if (isSuperAdmin && outletId) {
                where.order = {
                    outletId,
                };
            }
            // Get total count
            const total = yield prisma_config_1.default.bypassRequest.count({ where });
            // Get bypass requests
            const bypassRequests = yield prisma_config_1.default.bypassRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            outletId: true,
                            outlet: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    worker: {
                        select: {
                            id: true,
                            fullName: true,
                            role: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            return {
                bypassRequests: bypassRequests.map((br) => ({
                    id: br.id,
                    order: {
                        id: br.order.id,
                        orderNumber: br.order.orderNumber,
                        outlet: br.order.outlet,
                    },
                    worker: br.worker,
                    station: br.station,
                    reason: br.reason,
                    status: br.status,
                    adminNote: br.adminNote,
                    reviewedBy: br.reviewedBy,
                    createdAt: br.createdAt,
                    updatedAt: br.updatedAt,
                })),
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
};
