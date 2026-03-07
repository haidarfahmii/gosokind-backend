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
exports.orderQueryService = void 0;
const prisma_config_1 = __importDefault(require("../../config/prisma.config"));
const app_error_1 = require("../../utils/app-error");
exports.orderQueryService = {
    // Get all orders dimana super admin bisa melihat semua order sedangkan outlet admin hanya bisa melihat order pada outletnya
    getAllOrders(query, scopedOutletId, isSuperAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;
            const where = {
                deletedAt: null,
            };
            // Outlet scope: Outlet admin hanya bisa melihat order outletnya
            if (!isSuperAdmin && scopedOutletId) {
                where.outletId = scopedOutletId;
            }
            else if (isSuperAdmin && query.outletId) {
                // Super admin bisa filter by outlet
                where.outletId = query.outletId;
            }
            // Search filter (order number, customer name, customer email)
            if (query.search) {
                where.OR = [
                    { orderNumber: { contains: query.search, mode: "insensitive" } },
                    {
                        customer: {
                            fullName: { contains: query.search, mode: "insensitive" },
                        },
                    },
                    {
                        customer: { email: { contains: query.search, mode: "insensitive" } },
                    },
                ];
            }
            // Status filter
            if (query.status) {
                where.status = query.status;
            }
            // Date range filter
            if (query.startDate || query.endDate) {
                where.createdAt = {};
                if (query.startDate) {
                    where.createdAt.gte = new Date(query.startDate);
                }
                if (query.endDate) {
                    where.createdAt.lte = new Date(query.endDate);
                }
            }
            // Get total count
            const total = yield prisma_config_1.default.order.count({ where });
            // Get orders with relations
            const orders = yield prisma_config_1.default.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    address: {
                        select: {
                            id: true,
                            label: true,
                            address: true,
                            latitude: true,
                            longitude: true,
                        },
                    },
                    outlet: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    pickupDriver: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    deliveryDriver: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    orderItems: {
                        include: {
                            laundryItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                    stationProcesses: {
                        include: {
                            worker: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                            itemChecks: {
                                include: {
                                    laundryItem: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            startedAt: "asc",
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            const formattedOrders = orders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                totalWeight: order.totalWeight,
                totalPrice: order.totalPrice,
                isPaid: order.isPaid,
                status: order.status,
                pickupAt: order.pickupAt,
                customer: order.customer,
                address: order.address,
                outlet: order.outlet,
                pickupDriver: order.pickupDriver,
                deliveryDriver: order.deliveryDriver,
                orderItems: order.orderItems,
                stationProcesses: order.stationProcesses,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            }));
            return {
                orders: formattedOrders,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    getOrdersByCustomer(customerId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = query.page || 1;
            const limit = query.limit || 5;
            const skip = (page - 1) * limit;
            // Filter wajib: customerId harus sesuai dengan yang login
            const where = {
                deletedAt: null,
                customerId: customerId,
            };
            if (query.status) {
                where.status = query.status;
            }
            else {
                where.status = {
                    not: "COMPLETED"
                };
            }
            // Get total count
            const total = yield prisma_config_1.default.order.count({ where });
            // Get orders
            const orders = yield prisma_config_1.default.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    address: {
                        select: {
                            id: true,
                            label: true,
                            address: true,
                            latitude: true,
                            longitude: true,
                        },
                    },
                    outlet: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    pickupDriver: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    deliveryDriver: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    orderItems: {
                        include: {
                            laundryItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                    stationProcesses: {
                        include: {
                            worker: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                            itemChecks: {
                                include: {
                                    laundryItem: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            startedAt: "asc",
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            // Format response sesuai tipe data
            const formattedOrders = orders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                totalWeight: order.totalWeight,
                totalPrice: order.totalPrice,
                isPaid: order.isPaid,
                status: order.status,
                pickupAt: order.pickupAt,
                customer: order.customer,
                address: order.address,
                outlet: order.outlet,
                pickupDriver: order.pickupDriver,
                deliveryDriver: order.deliveryDriver,
                orderItems: order.orderItems,
                stationProcesses: order.stationProcesses,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            }));
            return {
                orders: formattedOrders,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    getOrderById(orderId, scopedOutletId, isSuperAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield prisma_config_1.default.order.findUnique({
                where: { id: orderId, deletedAt: null },
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    address: {
                        select: {
                            id: true,
                            label: true,
                            address: true,
                            latitude: true,
                            longitude: true,
                        },
                    },
                    outlet: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    pickupDriver: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    deliveryDriver: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    orderItems: {
                        include: {
                            laundryItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                    stationProcesses: {
                        include: {
                            worker: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                            itemChecks: {
                                include: {
                                    laundryItem: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            startedAt: "asc",
                        },
                    },
                },
            });
            if (!order) {
                throw (0, app_error_1.AppError)("Order not found", 404);
            }
            // Validate outlet scope
            if (!isSuperAdmin && scopedOutletId && order.outletId !== scopedOutletId) {
                throw (0, app_error_1.AppError)("Forbidden: You can only view orders from your own outlet", 403);
            }
            return {
                id: order.id,
                orderNumber: order.orderNumber,
                totalWeight: order.totalWeight,
                totalPrice: order.totalPrice,
                isPaid: order.isPaid,
                status: order.status,
                pickupAt: order.pickupAt,
                customer: order.customer,
                address: order.address,
                outlet: order.outlet,
                pickupDriver: order.pickupDriver,
                deliveryDriver: order.deliveryDriver,
                orderItems: order.orderItems,
                stationProcesses: order.stationProcesses,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            };
        });
    },
    getOrderByOrderNumber(orderNumber, scopedOutletId, isSuperAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield prisma_config_1.default.order.findUnique({
                where: { orderNumber: orderNumber }, // Pastikan orderNumber memiliki atribut @unique di schema prisma Anda
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                    address: {
                        select: {
                            id: true,
                            label: true,
                            address: true,
                            latitude: true,
                            longitude: true,
                        },
                    },
                    outlet: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    pickupDriver: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    deliveryDriver: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    orderItems: {
                        include: {
                            laundryItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    category: true,
                                },
                            },
                        },
                    },
                    stationProcesses: {
                        include: {
                            worker: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                            itemChecks: {
                                include: {
                                    laundryItem: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            startedAt: "asc",
                        },
                    },
                },
            });
            if (!order || order.deletedAt !== null) {
                throw (0, app_error_1.AppError)("Order not found", 404);
            }
            // Validate outlet scope
            if (!isSuperAdmin && scopedOutletId && order.outletId !== scopedOutletId) {
                throw (0, app_error_1.AppError)("Forbidden: You can only view orders from your own outlet", 403);
            }
            return {
                id: order.id,
                orderNumber: order.orderNumber,
                totalWeight: order.totalWeight,
                totalPrice: order.totalPrice,
                isPaid: order.isPaid,
                status: order.status,
                pickupAt: order.pickupAt,
                customer: order.customer,
                address: order.address,
                outlet: order.outlet,
                pickupDriver: order.pickupDriver,
                deliveryDriver: order.deliveryDriver,
                orderItems: order.orderItems,
                stationProcesses: order.stationProcesses,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            };
        });
    },
};
