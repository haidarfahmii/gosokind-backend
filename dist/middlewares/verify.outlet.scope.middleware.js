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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOutletScope = verifyOutletScope;
exports.validateOutletAccess = validateOutletAccess;
const app_error_1 = require("../utils/app-error");
const client_1 = require("@prisma/client");
function verifyOutletScope() {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Ambil payload dari res.locals
            const user = res.locals.payload;
            if (!user || !user.role) {
                return next((0, app_error_1.AppError)("Unauthorized: Invalid token payload", 401));
            }
            // Super Admin: Bypass outlet scope checking
            if (user.role === client_1.EmployeeRole.SUPER_ADMIN) {
                res.locals.isSuperAdmin = true;
                res.locals.scopedOutletId = null; // null = akses semua outlet
                return next();
            }
            // Non-Super Admin: Harus punya outletId
            let outletId = null;
            if (res.locals.employee && res.locals.employee.outletId) {
                outletId = res.locals.employee.outletId;
            }
            else {
                outletId = user.outletId || null;
            }
            if (!outletId) {
                return next((0, app_error_1.AppError)("Forbidden: Your account is not assigned to any outlet. Please contact Super Admin.", 403));
            }
            // Set outlet scope
            res.locals.isSuperAdmin = false;
            res.locals.scopedOutletId = outletId;
            next();
        }
        catch (error) {
            next(error);
        }
    });
}
// Helper function untuk validate apakah user bisa akses resource tertentu
function validateOutletAccess(resourceOutletId, scopedOutletId, isSuperAdmin) {
    // Super Admin: always allowed
    if (isSuperAdmin) {
        return true;
    }
    // Resource tidak punya outlet (e.g., customer) - allowed
    if (!resourceOutletId) {
        return true;
    }
    // Check apakah outlet match
    return resourceOutletId === scopedOutletId;
}
