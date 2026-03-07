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
exports.verifyAdmin = exports.verifySuperAdmin = exports.verifyWorker = void 0;
exports.verifyRole = verifyRole;
const client_1 = require("@prisma/client");
const app_error_1 = require("../utils/app-error");
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
function verifyRole(allowedRoles, options = {}) {
    return (_req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Ambil payload dari res.locals (hasil dari verifyToken)
            const user = res.locals.payload;
            // Pastikan user & role ada di token
            if (!user || !user.role || !user.userId) {
                return next((0, app_error_1.AppError)("Unauthorized: Invalid token payload", 401));
            }
            // Validasi role dari JWT
            if (!allowedRoles.includes(user.role)) {
                return next((0, app_error_1.AppError)(`Forbidden: Only ${allowedRoles.join(", ")} can access this resource`, 403));
            }
            // Critical endpoint check: Verify ke database (SECURE)
            // Hanya untuk endpoint yang butuh extra security
            if (options.critical) {
                const employee = yield prisma_config_1.default.employee.findUnique({
                    where: { id: user.userId, deletedAt: null },
                    select: {
                        id: true,
                        role: true,
                        outletId: true,
                    },
                });
                // Cek apakah employee masih ada dan rolenya masih sama
                if (!employee) {
                    return next((0, app_error_1.AppError)("Unauthorized: Employee not found or deleted", 401));
                }
                if (employee.role !== user.role) {
                    return next((0, app_error_1.AppError)("Unauthorized: Role has been changed. Please login again", 401));
                }
                // Simpan data employee ke res.locals untuk digunakan di controller
                res.locals.employee = employee;
            }
            else {
                // Untuk non-critical endpoint, simpan data dari JWT saja
                res.locals.employee = {
                    id: user.userId,
                    role: user.role,
                };
            }
            next(); // Lolos
        }
        catch (error) {
            next(error);
        }
    });
}
const verifyWorker = () => {
    return (req, res, next) => {
        try {
            const user = res.locals.payload;
            // Pastikan payload dan role tersedia
            if (!user || !user.role) {
                return next((0, app_error_1.AppError)("Unauthorized: Invalid token payload", 401));
            }
            const role = user.role;
            const allowedRoles = [
                client_1.EmployeeRole.SUPER_ADMIN,
                client_1.EmployeeRole.OUTLET_ADMIN,
                client_1.EmployeeRole.WORKER_WASHING,
                client_1.EmployeeRole.WORKER_IRONING,
                client_1.EmployeeRole.WORKER_PACKING,
            ];
            if (!allowedRoles.includes(role)) {
                throw (0, app_error_1.AppError)("Forbidden: Only workers and admins can access this resource", 403);
            }
            // Set res.locals.employee agar konsisten dengan middleware lain
            res.locals.employee = {
                id: user.userId,
                role: user.role,
            };
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.verifyWorker = verifyWorker;
const verifySuperAdmin = (critical = false) => verifyRole([client_1.EmployeeRole.SUPER_ADMIN], { critical });
exports.verifySuperAdmin = verifySuperAdmin;
const verifyAdmin = (critical = false) => verifyRole([client_1.EmployeeRole.SUPER_ADMIN, client_1.EmployeeRole.OUTLET_ADMIN], {
    critical,
});
exports.verifyAdmin = verifyAdmin;
