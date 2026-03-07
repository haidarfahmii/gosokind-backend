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
exports.laundryItemService = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const app_error_1 = require("../utils/app-error");
exports.laundryItemService = {
    createLaundryItem(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, category, unit, basePrice } = input;
            // Cek apakah item dengan nama yang sama sudah ada (case insensitive)
            const existingItem = yield prisma_config_1.default.laundryItem.findFirst({
                where: {
                    name: {
                        equals: name,
                        mode: "insensitive",
                    },
                    deletedAt: null,
                },
            });
            if (existingItem) {
                throw (0, app_error_1.AppError)(`Laundry item with name "${name}" already exists`, 400);
            }
            // Validasi basePrice jika diberikan
            if (basePrice !== undefined && basePrice < 1000) {
                throw (0, app_error_1.AppError)("Base price must be at least Rp 1,000", 400);
            }
            // Buat item baru
            const item = yield prisma_config_1.default.laundryItem.create({
                data: {
                    name,
                    category: category || null,
                    unit: unit || null,
                    basePrice: basePrice || null,
                },
            });
            return {
                id: item.id,
                name: item.name,
                category: item.category,
                unit: item.unit,
                basePrice: item.basePrice,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        });
    },
    getAllLaundryItems(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, search, category, sortBy = "name", sortOrder = "asc", } = query;
            const skip = (page - 1) * limit;
            // Build filter
            const where = {
                deletedAt: null,
            };
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: "insensitive" } },
                    { category: { contains: search, mode: "insensitive" } },
                ];
            }
            if (category) {
                where.category = {
                    equals: category,
                    mode: "insensitive",
                };
            }
            // Get total count
            const total = yield prisma_config_1.default.laundryItem.count({ where });
            const orderBy = {};
            orderBy[sortBy] = sortOrder;
            // Get items
            const items = yield prisma_config_1.default.laundryItem.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    _count: {
                        select: {
                            orderItems: true,
                            stationChecks: true,
                        },
                    },
                },
            });
            const formattedItems = items.map((item) => ({
                id: item.id,
                name: item.name,
                category: item.category,
                unit: item.unit,
                basePrice: item.basePrice,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                usageCount: item._count.orderItems,
            }));
            return {
                data: formattedItems,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    getLaundryItemById(itemId) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield prisma_config_1.default.laundryItem.findUnique({
                where: { id: itemId, deletedAt: null },
                include: {
                    _count: {
                        select: {
                            orderItems: true,
                        },
                    },
                    orderItems: {
                        select: {
                            order: {
                                select: {
                                    status: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!item) {
                throw (0, app_error_1.AppError)("Laundry item not found", 404);
            }
            const activeOrders = item.orderItems.filter((oi) => oi.order.status !== "COMPLETED").length;
            const completedOrders = item.orderItems.filter((oi) => oi.order.status === "COMPLETED").length;
            return {
                id: item.id,
                name: item.name,
                category: item.category,
                unit: item.unit,
                basePrice: item.basePrice,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                usageStats: {
                    totalOrders: item._count.orderItems,
                    activeOrders,
                    completedOrders,
                },
            };
        });
    },
    updateLaundryItem(itemId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, category, unit, basePrice } = input;
            // Cek apakah item ada
            const existingItem = yield prisma_config_1.default.laundryItem.findUnique({
                where: { id: itemId, deletedAt: null },
            });
            if (!existingItem) {
                throw (0, app_error_1.AppError)("Laundry item not found", 404);
            }
            // Jika name diubah, cek duplikasi
            if (name && name !== existingItem.name) {
                const duplicateItem = yield prisma_config_1.default.laundryItem.findFirst({
                    where: {
                        name: {
                            equals: name,
                            mode: "insensitive",
                        },
                        deletedAt: null,
                        id: { not: itemId },
                    },
                });
                if (duplicateItem) {
                    throw (0, app_error_1.AppError)(`Laundry item with name "${name}" already exists`, 400);
                }
            }
            // Validasi basePrice jika diberikan
            if (basePrice !== undefined && basePrice < 1000) {
                throw (0, app_error_1.AppError)("Base price must be at least Rp 1,000", 400);
            }
            // Build update data
            const updateData = {};
            if (name !== undefined)
                updateData.name = name.trim();
            if (category !== undefined)
                updateData.category = category;
            if (unit !== undefined)
                updateData.unit = unit;
            if (basePrice !== undefined)
                updateData.basePrice = basePrice;
            // Update item
            const updatedItem = yield prisma_config_1.default.laundryItem.update({
                where: { id: itemId },
                data: updateData,
            });
            return {
                id: updatedItem.id,
                name: updatedItem.name,
                category: updatedItem.category,
                unit: updatedItem.unit,
                basePrice: updatedItem.basePrice,
                createdAt: updatedItem.createdAt,
                updatedAt: updatedItem.updatedAt,
            };
        });
    },
    deleteLaundryItem(itemId) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield prisma_config_1.default.laundryItem.findUnique({
                where: { id: itemId, deletedAt: null },
                include: {
                    _count: {
                        select: {
                            orderItems: true,
                        },
                    },
                },
            });
            if (!item) {
                throw (0, app_error_1.AppError)("Laundry item not found", 404);
            }
            // Cek apakah item masih digunakan di order items
            const usedInOrders = yield prisma_config_1.default.orderItem.count({
                where: {
                    laundryItemId: itemId,
                    order: {
                        status: {
                            notIn: ["COMPLETED"],
                        },
                    },
                },
            });
            if (usedInOrders > 0) {
                throw (0, app_error_1.AppError)("Cannot delete laundry item. It is still being used in active orders.", 400);
            }
            const totalUsage = item._count.orderItems;
            console.log(`🗑️ Deleting laundry item "${item.name}" (used ${totalUsage} times in completed orders)`);
            // Soft delete
            yield prisma_config_1.default.laundryItem.update({
                where: { id: itemId },
                data: {
                    deletedAt: new Date(),
                },
            });
        });
    },
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield prisma_config_1.default.laundryItem.findMany({
                where: {
                    deletedAt: null,
                    category: {
                        not: null,
                    },
                },
                select: {
                    category: true,
                },
                distinct: ["category"],
            });
            return items
                .map((item) => item.category)
                .filter((cat) => cat !== null)
                .sort();
        });
    },
    getPopularItems() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            const items = yield prisma_config_1.default.laundryItem.findMany({
                where: {
                    deletedAt: null,
                },
                include: {
                    _count: {
                        select: {
                            orderItems: true,
                        },
                    },
                },
                orderBy: {
                    orderItems: {
                        _count: "desc",
                    },
                },
                take: limit,
            });
            return items.map((item) => ({
                id: item.id,
                name: item.name,
                category: item.category,
                basePrice: item.basePrice,
                usageCount: item._count.orderItems,
            }));
        });
    },
};
