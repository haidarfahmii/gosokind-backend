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
exports.employeeService = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const app_error_1 = require("../utils/app-error");
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const driver_service_1 = require("./driver.service");
const worker_service_1 = require("./worker.service");
exports.employeeService = {
    createEmployee(input_1) {
        return __awaiter(this, arguments, void 0, function* (input, scopedOutletId = null, isSuperAdmin = false) {
            var _a, _b;
            let { email, password, fullName, role, outletId } = input;
            if (!isSuperAdmin && scopedOutletId) {
                // Jika outlet admin tidak mengirim outletId, gunakan scopedOutletId mereka
                if (!outletId) {
                    outletId = scopedOutletId;
                }
                // Jika outlet admin mengirim outletId, pastikan sama dengan scopedOutletId
                if (outletId !== scopedOutletId) {
                    throw (0, app_error_1.AppError)("Forbidden: You can only create employees for your own outlet", 403);
                }
                // outlet admin tidak bisa membuat super admin atau outlet admin lain
                if (role === client_1.EmployeeRole.SUPER_ADMIN ||
                    role === client_1.EmployeeRole.OUTLET_ADMIN) {
                    throw (0, app_error_1.AppError)("Forbidden: You cannot create Super Admin or Outlet Admin accounts", 403);
                }
            }
            // Cek apakah email sudah digunakan
            const existingEmployee = yield prisma_config_1.default.employee.findUnique({
                where: { email },
            });
            if (existingEmployee) {
                throw (0, app_error_1.AppError)("Email already exists", 400);
            }
            // Validasi jika bukan Super Admin, outletId harus ada
            if (role !== client_1.EmployeeRole.SUPER_ADMIN && !outletId) {
                throw (0, app_error_1.AppError)("Outlet is required for non-Super Admin roles", 400);
            }
            // Validasi jJika Super Admin, outletId harus null
            if (role === client_1.EmployeeRole.SUPER_ADMIN && outletId) {
                throw (0, app_error_1.AppError)("Super Admin cannot be assigned to an outlet", 400);
            }
            // Hanya super admin yang bisa membuat super admin atau outlet admin
            if (!isSuperAdmin &&
                (role === client_1.EmployeeRole.SUPER_ADMIN || role === client_1.EmployeeRole.OUTLET_ADMIN)) {
                throw (0, app_error_1.AppError)("Forbidden: Only Super Admin can create Super Admin or Outlet Admin accounts", 403);
            }
            // Validasi outlet jika ada
            if (outletId) {
                const outlet = yield prisma_config_1.default.outlet.findUnique({
                    where: { id: outletId },
                });
                if (!outlet) {
                    throw (0, app_error_1.AppError)("Outlet not found", 404);
                }
            }
            // Hash password
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            // Buat employee
            const employee = yield prisma_config_1.default.employee.create({
                data: {
                    email,
                    password: hashedPassword,
                    fullName,
                    role,
                    outletId: role === client_1.EmployeeRole.SUPER_ADMIN ? null : outletId,
                    isActive: (_a = input.isActive) !== null && _a !== void 0 ? _a : true,
                },
                include: {
                    outlet: true,
                },
            });
            return {
                id: employee.id,
                email: employee.email,
                fullName: employee.fullName,
                avatarUrl: employee.avatarUrl,
                role: employee.role,
                outletId: employee.outletId,
                outletName: (_b = employee.outlet) === null || _b === void 0 ? void 0 : _b.name,
                isActive: employee.isActive,
                createdAt: employee.createdAt,
                updatedAt: employee.updatedAt,
            };
        });
    },
    getAllEmployees(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, scopedOutletId = null, isSuperAdmin = false) {
            const { page = 1, limit = 10, role, outletId, search, isActive } = query;
            const skip = (page - 1) * limit;
            // Build filter
            const where = {
                deletedAt: null,
            };
            // outlet scope
            if (!isSuperAdmin && scopedOutletId) {
                // jika outlet admin, batasi ke outletnya
                where.outletId = scopedOutletId;
            }
            else if (isSuperAdmin && outletId) {
                where.outletId = outletId;
            }
            if (role) {
                where.role = role;
            }
            if (outletId) {
                where.outletId = outletId;
            }
            if (isActive !== undefined) {
                where.isActive = isActive;
            }
            if (search) {
                where.OR = [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ];
            }
            // Get total count
            const total = yield prisma_config_1.default.employee.count({ where });
            // Get employees
            const employees = yield prisma_config_1.default.employee.findMany({
                where,
                skip,
                take: limit,
                include: {
                    outlet: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            const formattedEmployees = employees.map((emp) => {
                var _a;
                return ({
                    id: emp.id,
                    email: emp.email,
                    fullName: emp.fullName,
                    avatarUrl: emp.avatarUrl,
                    role: emp.role,
                    outletId: emp.outletId,
                    outletName: (_a = emp.outlet) === null || _a === void 0 ? void 0 : _a.name,
                    isActive: emp.isActive,
                    createdAt: emp.createdAt,
                    updatedAt: emp.updatedAt,
                });
            });
            return {
                data: formattedEmployees,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    getEmployeeStats() {
        return __awaiter(this, arguments, void 0, function* (scopedOutletId = null, isSuperAdmin = false) {
            // Build where clause dengan outlet scope
            const where = { deletedAt: null };
            if (!isSuperAdmin && scopedOutletId) {
                where.outletId = scopedOutletId;
            }
            // Hitung total, active, inactive secara paralel
            const [total, active, inactive, byRoleRaw] = yield Promise.all([
                prisma_config_1.default.employee.count({ where }),
                prisma_config_1.default.employee.count({ where: Object.assign(Object.assign({}, where), { isActive: true }) }),
                prisma_config_1.default.employee.count({ where: Object.assign(Object.assign({}, where), { isActive: false }) }),
                prisma_config_1.default.employee.groupBy({
                    by: ["role"],
                    where,
                    _count: { role: true },
                }),
            ]);
            // Format byRole menjadi { ROLE_NAME: count }
            const byRole = byRoleRaw.reduce((acc, item) => {
                acc[item.role] = item._count.role;
                return acc;
            }, {});
            return { total, active, inactive, byRole };
        });
    },
    getEmployeeById(employeeId_1) {
        return __awaiter(this, arguments, void 0, function* (employeeId, scopedOutletId = null, isSuperAdmin = false) {
            var _a;
            const where = {
                id: employeeId,
                deletedAt: null,
            };
            // outlet scope
            if (!isSuperAdmin && scopedOutletId) {
                // outlet admin hanya bisa akses employee di outletnya
                where.outletId = scopedOutletId;
            }
            const employee = yield prisma_config_1.default.employee.findUnique({
                where: { id: employeeId, deletedAt: null },
                include: {
                    outlet: true,
                },
            });
            if (!employee) {
                throw (0, app_error_1.AppError)("Employee not found or you don't have access to this employee", 404);
            }
            // Double check outlet scope untuk non-super admin
            if (!isSuperAdmin &&
                scopedOutletId &&
                employee.outletId !== scopedOutletId) {
                throw (0, app_error_1.AppError)("Forbidden: You don't have access to this employee", 403);
            }
            return {
                id: employee.id,
                email: employee.email,
                fullName: employee.fullName,
                avatarUrl: employee.avatarUrl,
                role: employee.role,
                outletId: employee.outletId,
                outletName: (_a = employee.outlet) === null || _a === void 0 ? void 0 : _a.name,
                isActive: employee.isActive,
                createdAt: employee.createdAt,
                updatedAt: employee.updatedAt,
            };
        });
    },
    updateEmployee(employeeId_1, input_1) {
        return __awaiter(this, arguments, void 0, function* (employeeId, input, scopedOutletId = null, isSuperAdmin = false) {
            var _a;
            let { email, password, fullName, role, outletId, isActive } = input;
            // Cek apakah employee ada
            const existingEmployee = yield prisma_config_1.default.employee.findUnique({
                where: { id: employeeId, deletedAt: null },
            });
            if (!existingEmployee) {
                throw (0, app_error_1.AppError)("Employee not found", 404);
            }
            // outlet admin hanya bisa update employee di outletnya sendiri
            if (!isSuperAdmin && scopedOutletId) {
                // Cek apakah employee yang akan di-update ada di outlet yang sama
                if (existingEmployee.outletId !== scopedOutletId) {
                    throw (0, app_error_1.AppError)("Forbidden: You can only update employees in your own outlet", 403);
                }
                // Jika mencoba mengubah outletId
                if (outletId !== undefined) {
                    // Jika outletId null atau berbeda, tolak
                    if (!outletId || outletId !== scopedOutletId) {
                        throw (0, app_error_1.AppError)("Forbidden: You cannot move employees to other outlets", 403);
                    }
                }
                // outlet admin tidak bisa mengubah role menjadi super admin atau outlet admin
                if (role &&
                    (role === client_1.EmployeeRole.SUPER_ADMIN ||
                        role === client_1.EmployeeRole.OUTLET_ADMIN)) {
                    throw (0, app_error_1.AppError)("Forbidden: You cannot change employee role to Super Admin or Outlet Admin", 403);
                }
            }
            // Jika email diubah, cek duplikasi
            if (email && email !== existingEmployee.email) {
                const emailExists = yield prisma_config_1.default.employee.findUnique({
                    where: { email },
                });
                if (emailExists) {
                    throw (0, app_error_1.AppError)("Email already exists", 400);
                }
            }
            // validasi outlet jika di ubah
            if (outletId !== undefined) {
                // jika role di ubah menjadi Super Admin, outletId harus null
                const newRole = role || existingEmployee.role;
                if (newRole === client_1.EmployeeRole.SUPER_ADMIN && outletId !== null) {
                    throw (0, app_error_1.AppError)("Super Admin cannot be assigned to an outlet", 400);
                }
                // jika bukan Super Admin, outletId harus ada
                if (newRole !== client_1.EmployeeRole.SUPER_ADMIN && outletId) {
                    const outlet = yield prisma_config_1.default.outlet.findUnique({
                        where: { id: outletId },
                    });
                    if (!outlet) {
                        throw (0, app_error_1.AppError)("Outlet not found", 404);
                    }
                }
            }
            let hashedPassword;
            if (password) {
                hashedPassword = yield bcrypt_1.default.hash(password, 10);
            }
            // Update employee
            const updatedEmployee = yield prisma_config_1.default.employee.update({
                where: { id: employeeId },
                data: {
                    email,
                    password: hashedPassword,
                    fullName,
                    role,
                    outletId,
                    isActive,
                },
                include: {
                    outlet: true,
                },
            });
            return {
                id: updatedEmployee.id,
                email: updatedEmployee.email,
                fullName: updatedEmployee.fullName,
                avatarUrl: updatedEmployee.avatarUrl,
                role: updatedEmployee.role,
                outletId: updatedEmployee.outletId,
                outletName: (_a = updatedEmployee.outlet) === null || _a === void 0 ? void 0 : _a.name,
                isActive: updatedEmployee.isActive,
                createdAt: updatedEmployee.createdAt,
                updatedAt: updatedEmployee.updatedAt,
            };
        });
    },
    deleteEmployee(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const employee = yield prisma_config_1.default.employee.findUnique({
                where: { id: employeeId, deletedAt: null },
            });
            if (!employee) {
                throw (0, app_error_1.AppError)("Employee not found", 404);
            }
            // Cek apakah ada order yang masih aktif
            const activeOrders = yield prisma_config_1.default.order.count({
                where: {
                    OR: [{ pickupDriverId: employeeId }, { deliveryDriverId: employeeId }],
                    status: {
                        notIn: ["COMPLETED"],
                    },
                },
            });
            if (activeOrders > 0) {
                throw (0, app_error_1.AppError)("Cannot delete employee with active orders. Please reassign or complete orders first.", 400);
            }
            // Soft delete
            yield prisma_config_1.default.employee.update({
                where: { id: employeeId },
                data: {
                    deletedAt: new Date(),
                },
            });
        });
    },
    getAllCustomers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 10, search } = query;
            const skip = (page - 1) * limit;
            const where = {
                deletedAt: null,
            };
            if (search) {
                where.OR = [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ];
            }
            const total = yield prisma_config_1.default.customer.count({ where });
            const customers = yield prisma_config_1.default.customer.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    avatarUrl: true,
                    isVerified: true,
                    provider: true,
                    createdAt: true,
                    updatedAt: true,
                    addresses: {
                        where: { isPrimary: true }, // Hanya ambil primary address
                        select: {
                            id: true,
                            label: true,
                            address: true,
                            latitude: true,
                            longitude: true,
                            isPrimary: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            return {
                data: customers,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        });
    },
    toggleEmployeeStatus(employeeId_1, isActive_1) {
        return __awaiter(this, arguments, void 0, function* (employeeId, isActive, scopedOutletId = null, isSuperAdmin = false) {
            var _a;
            const employee = yield prisma_config_1.default.employee.findUnique({
                where: { id: employeeId, deletedAt: null },
                include: {
                    outlet: true,
                },
            });
            if (!employee) {
                throw (0, app_error_1.AppError)("Employee not found", 404);
            }
            // validasi outlet admin hanya bisa toggle employee di outletnya
            if (!isSuperAdmin && scopedOutletId) {
                if (employee.outletId !== scopedOutletId) {
                    throw (0, app_error_1.AppError)("Forbidden: You can only change status of employees in your own outlet", 403);
                }
            }
            const updatedEmployee = yield prisma_config_1.default.employee.update({
                where: { id: employeeId },
                data: { isActive },
                include: {
                    outlet: true,
                },
            });
            return {
                id: updatedEmployee.id,
                email: updatedEmployee.email,
                fullName: updatedEmployee.fullName,
                avatarUrl: updatedEmployee.avatarUrl,
                role: updatedEmployee.role,
                outletId: updatedEmployee.outletId,
                outletName: (_a = updatedEmployee.outlet) === null || _a === void 0 ? void 0 : _a.name,
                isActive: updatedEmployee.isActive,
                createdAt: updatedEmployee.createdAt,
                updatedAt: updatedEmployee.updatedAt,
            };
        });
    },
    getEmployeeHistory(employeeId_1, page_1, limit_1) {
        return __awaiter(this, arguments, void 0, function* (employeeId, page, limit, scopedOutletId = null, isSuperAdmin = false) {
            const employee = yield prisma_config_1.default.employee.findUnique({
                where: { id: employeeId, deletedAt: null },
                select: {
                    id: true,
                    role: true,
                    outletId: true
                }
            });
            if (!employee) {
                throw (0, app_error_1.AppError)("Employee not found", 404);
            }
            // Role validation
            const allowedRoles = [
                client_1.EmployeeRole.DRIVER,
                client_1.EmployeeRole.WORKER_WASHING,
                client_1.EmployeeRole.WORKER_IRONING,
                client_1.EmployeeRole.WORKER_PACKING
            ];
            if (!allowedRoles.includes(employee.role)) {
                throw (0, app_error_1.AppError)("History is only available for Drivers and Workers", 400);
            }
            // Outlet validation
            if (!isSuperAdmin && scopedOutletId && employee.outletId !== scopedOutletId) {
                throw (0, app_error_1.AppError)("Forbidden: You can only view history of employees in your own outlet", 403);
            }
            // Fetch matching history based on role
            if (employee.role === client_1.EmployeeRole.DRIVER) {
                return yield (0, driver_service_1.getDriverHistory)(employee.id, page, limit);
            }
            else {
                return yield (0, worker_service_1.getWorkerHistory)(employee.id, page, limit);
            }
        });
    },
};
