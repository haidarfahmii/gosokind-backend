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
exports.outletService = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const app_error_1 = require("../utils/app-error");
const geo_service_1 = require("./geo.service");
const city_code_util_1 = require("../utils/city-code.util");
exports.outletService = {
    generateOutletCode(city) {
        return __awaiter(this, void 0, void 0, function* () {
            // ambil kata pertama dari nama kota, uppercase, hapus non-alfanumerik
            const cityCode = (0, city_code_util_1.getCityCode)(city);
            const prefix = `OUT-${cityCode}-`;
            // Hitung berapa outlet (termasuk yang sudah dihapus) dengan prefix yang sama
            // Menggunakan deleted outlets juga agar nomor urut tidak pernah duplikat
            const existingCount = yield prisma_config_1.default.outlet.count({
                where: {
                    outletCode: {
                        startsWith: prefix,
                    },
                },
            });
            const sequence = String(existingCount + 1).padStart(3, "0");
            return `${prefix}${sequence}`;
        });
    },
    getAllOutlets(page_1, limit_1, search_1) {
        return __awaiter(this, arguments, void 0, function* (page, limit, search, scopedOutletId = null, isSuperAdmin = false) {
            const skip = (page - 1) * limit;
            const where = {
                deletedAt: null,
            };
            // Outlet scope
            if (!isSuperAdmin && scopedOutletId) {
                // Outlet admin hanya bisa lihat outletnya sendiri
                where.id = scopedOutletId;
            }
            // Search filter
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: "insensitive" } },
                    { address: { contains: search, mode: "insensitive" } },
                    { city: { contains: search, mode: "insensitive" } },
                    { province: { contains: search, mode: "insensitive" } },
                    { outletCode: { contains: search, mode: "insensitive" } },
                ];
            }
            // Get total count
            const total = yield prisma_config_1.default.outlet.count({ where });
            // Get outlets
            const outlets = yield prisma_config_1.default.outlet.findMany({
                where,
                skip,
                take: limit,
                include: {
                    employees: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            fullName: true,
                            role: true,
                            isActive: true,
                        },
                    },
                    _count: {
                        select: {
                            employees: {
                                where: { deletedAt: null },
                            },
                            orders: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            // Format response
            const formattedOutlets = outlets.map((outlet) => ({
                id: outlet.id,
                outletCode: outlet.outletCode,
                name: outlet.name,
                address: outlet.address,
                province: outlet.province,
                city: outlet.city,
                latitude: outlet.latitude,
                longitude: outlet.longitude,
                status: outlet.status,
                employeeCount: outlet._count.employees,
                orderCount: outlet._count.orders,
                employees: outlet.employees,
                createdAt: outlet.createdAt,
                updatedAt: outlet.updatedAt,
            }));
            return {
                outlets: formattedOutlets,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    getAllOutletsForDropdown() {
        return __awaiter(this, arguments, void 0, function* (scopedOutletId = null, isSuperAdmin = false) {
            const where = {
                deletedAt: null,
                status: "AVAILABLE", // hanya outlet aktif untuk dropdown
            };
            // Outlet Admin hanya bisa lihat outletnya sendiri
            if (!isSuperAdmin && scopedOutletId) {
                where.id = scopedOutletId;
            }
            const outlets = yield prisma_config_1.default.outlet.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    outletCode: true,
                },
                orderBy: {
                    name: "asc",
                },
                // Tidak ada `take` / `skip` — ambil SEMUA outlet untuk dropdown
            });
            return outlets;
        });
    },
    getOutletById(outletId_1) {
        return __awaiter(this, arguments, void 0, function* (outletId, scopedOutletId = null, isSuperAdmin = false) {
            if (!isSuperAdmin && scopedOutletId && outletId !== scopedOutletId) {
                throw (0, app_error_1.AppError)("Forbidden: You can only view your own outlet details", 403);
            }
            const outlet = yield prisma_config_1.default.outlet.findUnique({
                where: { id: outletId, deletedAt: null },
                include: {
                    employees: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                            isActive: true,
                            avatarUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            employees: {
                                where: { deletedAt: null },
                            },
                            orders: true,
                        },
                    },
                },
            });
            if (!outlet) {
                throw (0, app_error_1.AppError)("Outlet not found", 404);
            }
            return {
                id: outlet.id,
                outletCode: outlet.outletCode,
                name: outlet.name,
                address: outlet.address,
                province: outlet.province,
                city: outlet.city,
                latitude: outlet.latitude,
                longitude: outlet.longitude,
                status: outlet.status,
                employeeCount: outlet._count.employees,
                orderCount: outlet._count.orders,
                employees: outlet.employees,
                createdAt: outlet.createdAt,
                updatedAt: outlet.updatedAt,
            };
        });
    },
    createOutlet(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, province, city, address, latitude, longitude, status } = input;
            // Validasi koordinat wajib ada (dikirim dari Leaflet)
            if (latitude === undefined || longitude === undefined) {
                throw (0, app_error_1.AppError)("Latitude and longitude are required. Please pick a location on the map.", 400);
            }
            // Validate coordinates
            if (!geo_service_1.geoService.validateCoordinates(latitude, longitude)) {
                throw (0, app_error_1.AppError)("Invalid coordinates", 400);
            }
            // Check duplicate outlet name
            const existingOutlet = yield prisma_config_1.default.outlet.findFirst({
                where: {
                    name: {
                        equals: name,
                        mode: "insensitive",
                    },
                    deletedAt: null,
                },
            });
            if (existingOutlet) {
                throw (0, app_error_1.AppError)(`Outlet with name "${name}" already exists`, 400);
            }
            const cityForCode = city || province || "UNK";
            const outletCode = yield this.generateOutletCode(cityForCode);
            // Create outlet
            const outlet = yield prisma_config_1.default.outlet.create({
                data: {
                    outletCode,
                    name,
                    province,
                    city,
                    address,
                    latitude,
                    longitude,
                    status: status || "AVAILABLE",
                },
                include: {
                    employees: {
                        where: { deletedAt: null },
                    },
                    _count: {
                        select: {
                            employees: {
                                where: { deletedAt: null },
                            },
                            orders: true,
                        },
                    },
                },
            });
            return {
                id: outlet.id,
                outletCode: outlet.outletCode,
                name: outlet.name,
                address: outlet.address,
                province: outlet.province,
                city: outlet.city,
                latitude: outlet.latitude,
                longitude: outlet.longitude,
                status: outlet.status,
                employeeCount: outlet._count.employees,
                orderCount: outlet._count.orders,
                employees: outlet.employees,
                createdAt: outlet.createdAt,
                updatedAt: outlet.updatedAt,
            };
        });
    },
    updateOutlet(outletId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if outlet exists
            const existingOutlet = yield prisma_config_1.default.outlet.findUnique({
                where: { id: outletId, deletedAt: null },
            });
            if (!existingOutlet) {
                throw (0, app_error_1.AppError)("Outlet not found", 404);
            }
            // Validate coordinates if provided
            if (input.latitude !== undefined && input.longitude !== undefined) {
                if (!geo_service_1.geoService.validateCoordinates(input.latitude, input.longitude)) {
                    throw (0, app_error_1.AppError)("Invalid coordinates", 400);
                }
            }
            // Check duplicate name if name is being updated
            if (input.name && input.name !== existingOutlet.name) {
                const duplicateOutlet = yield prisma_config_1.default.outlet.findFirst({
                    where: {
                        name: {
                            equals: input.name,
                            mode: "insensitive",
                        },
                        id: {
                            not: outletId,
                        },
                        deletedAt: null,
                    },
                });
                if (duplicateOutlet) {
                    throw (0, app_error_1.AppError)(`Outlet with name "${input.name}" already exists`, 400);
                }
            }
            // Update outlet
            const outlet = yield prisma_config_1.default.outlet.update({
                where: { id: outletId },
                data: {
                    name: input.name,
                    province: input.province,
                    city: input.city,
                    address: input.address,
                    latitude: input.latitude,
                    longitude: input.longitude,
                    status: input.status,
                },
                include: {
                    employees: {
                        where: { deletedAt: null },
                    },
                    _count: {
                        select: {
                            employees: {
                                where: { deletedAt: null },
                            },
                            orders: true,
                        },
                    },
                },
            });
            return {
                id: outlet.id,
                outletCode: outlet.outletCode,
                name: outlet.name,
                address: outlet.address,
                province: outlet.province,
                city: outlet.city,
                latitude: outlet.latitude,
                longitude: outlet.longitude,
                status: outlet.status,
                employeeCount: outlet._count.employees,
                orderCount: outlet._count.orders,
                employees: outlet.employees,
                createdAt: outlet.createdAt,
                updatedAt: outlet.updatedAt,
            };
        });
    },
    deleteOutlet(outletId) {
        return __awaiter(this, void 0, void 0, function* () {
            const outlet = yield prisma_config_1.default.outlet.findUnique({
                where: { id: outletId, deletedAt: null },
                include: {
                    employees: {
                        where: { deletedAt: null },
                    },
                    orders: true,
                },
            });
            if (!outlet) {
                throw (0, app_error_1.AppError)("Outlet not found", 404);
            }
            // Check if outlet has active employees
            if (outlet.employees.length > 0) {
                throw (0, app_error_1.AppError)(`Cannot delete outlet: ${outlet.employees.length} employee(s) are still assigned to this outlet`, 400);
            }
            // Check if outlet has orders
            if (outlet.orders.length > 0) {
                throw (0, app_error_1.AppError)(`Cannot delete outlet: This outlet has ${outlet.orders.length} order(s) in the system`, 400);
            }
            // Soft delete
            yield prisma_config_1.default.outlet.update({
                where: { id: outletId },
                data: {
                    deletedAt: new Date(),
                },
            });
        });
    },
    calculateShipping(outletId_1, customerLatitude_1, customerLongitude_1) {
        return __awaiter(this, arguments, void 0, function* (outletId, customerLatitude, customerLongitude, scopedOutletId = null, isSuperAdmin = false) {
            // OUTLET SCOPE ENFORCEMENT
            if (!isSuperAdmin && scopedOutletId && outletId !== scopedOutletId) {
                throw (0, app_error_1.AppError)("Forbidden: You can only calculate shipping for your own outlet", 403);
            }
            // Get outlet
            const outlet = yield prisma_config_1.default.outlet.findUnique({
                where: { id: outletId, deletedAt: null },
            });
            if (!outlet) {
                throw (0, app_error_1.AppError)("Outlet not found", 404);
            }
            // Validate customer coordinates
            if (!geo_service_1.geoService.validateCoordinates(customerLatitude, customerLongitude)) {
                throw (0, app_error_1.AppError)("Invalid customer coordinates", 400);
            }
            // Calculate distance
            const distance = geo_service_1.geoService.calculateDistance(outlet.latitude, outlet.longitude, customerLatitude, customerLongitude);
            // Calculate shipping cost (example: Rp 5,000 per km, min Rp 10,000)
            const pricePerKm = 5000;
            const minPrice = 10000;
            const shippingCost = Math.max(Math.ceil(distance * pricePerKm), minPrice);
            return {
                outlet: {
                    id: outlet.id,
                    outletCode: outlet.outletCode,
                    name: outlet.name,
                    address: outlet.address,
                    coordinates: {
                        latitude: outlet.latitude,
                        longitude: outlet.longitude,
                    },
                },
                customer: {
                    coordinates: {
                        latitude: customerLatitude,
                        longitude: customerLongitude,
                    },
                },
                distance: `${distance} km`,
                shippingCost,
                estimatedTime: `${Math.ceil(distance / 30)} - ${Math.ceil(distance / 20)} minutes`, // Assuming 20-30 km/h average speed
            };
        });
    },
};
