"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.attendanceController = void 0;
const zod_1 = require("zod");
const attendanceService = __importStar(require("../services/attendance.service"));
const client_1 = require("@prisma/client");
const attendanceSchema = zod_1.z.object({
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
});
exports.attendanceController = {
    clockIn(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const userId = payload.userId;
                const parsed = attendanceSchema.safeParse(req.body);
                if (!parsed.success) {
                    return res.status(400).json({
                        success: false,
                        message: "Latitude and Longitude are required as numbers.",
                        errors: parsed.error.issues,
                    });
                }
                const { latitude, longitude } = parsed.data;
                const result = yield attendanceService.clockIn(userId, latitude, longitude);
                res.status(201).json({ success: true, data: result });
            }
            catch (error) {
                const errorMap = {
                    ALREADY_CLOCKED_IN: {
                        status: 400,
                        message: "User is already clocked in.",
                    },
                    OUT_OF_RANGE: {
                        status: 400,
                        message: "You are too far from the outlet.",
                    },
                    NO_OUTLET_ASSIGNED: {
                        status: 400,
                        message: "No outlet assigned to this employee account.",
                    },
                    EMPLOYEE_NOT_FOUND: { status: 404, message: "Employee not found." },
                };
                const mapped = errorMap[error.message];
                if (mapped) {
                    return res
                        .status(mapped.status)
                        .json({ success: false, message: mapped.message });
                }
                next(error);
            }
        });
    },
    clockOut(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const userId = payload.userId;
                const result = yield attendanceService.clockOut(userId);
                res.json({ success: true, data: result });
            }
            catch (error) {
                if (error.message === "NOT_CLOCKED_IN") {
                    return res
                        .status(400)
                        .json({ success: false, message: "User is not clocked in." });
                }
                next(error);
            }
        });
    },
    getDashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const { userId, role } = payload;
                const queryId = req.query.employeeId;
                const date = req.query.date;
                // RBAC: Only SUPER_ADMIN/OUTLET_ADMIN can request other employee's data
                let targetId = userId;
                if (role === client_1.EmployeeRole.SUPER_ADMIN ||
                    role === client_1.EmployeeRole.OUTLET_ADMIN) {
                    targetId = queryId || userId;
                }
                const data = yield attendanceService.getDashboardData(targetId, date);
                res.json({ success: true, data });
            }
            catch (error) {
                next(error);
            }
        });
    },
    getAllAttendance(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const scopedOutletId = res.locals.scopedOutletId;
                if (!scopedOutletId) {
                    return res.status(403).json({
                        success: false,
                        message: "You must be assigned to an outlet to view attendance records.",
                    });
                }
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const date = req.query.date;
                const result = yield attendanceService.getAllAttendance(scopedOutletId, page, limit, date);
                res.json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    },
    getHistory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const { userId, role } = payload;
                const queryId = req.query.employeeId;
                const date = req.query.date;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                let targetId = userId;
                if (role === client_1.EmployeeRole.SUPER_ADMIN ||
                    role === client_1.EmployeeRole.OUTLET_ADMIN) {
                    targetId = queryId || userId;
                }
                const result = yield attendanceService.getEmployeeHistory(targetId, page, limit, date);
                res.json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    },
};
