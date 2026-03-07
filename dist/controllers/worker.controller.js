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
exports.workerController = void 0;
const zod_1 = require("zod");
const workerService = __importStar(require("../services/worker.service"));
const client_1 = require("@prisma/client");
const processOrderSchema = zod_1.z.object({
    orderId: zod_1.z.string().cuid(),
    station: zod_1.z.nativeEnum(client_1.StationType),
    items: zod_1.z
        .array(zod_1.z.object({
        laundryItemId: zod_1.z.string(),
        quantity: zod_1.z.number().int().min(0),
    }))
        .nonempty(),
});
exports.workerController = {
    getOrderList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const sortBy = req.query.sortBy || "asc";
                const timeFilter = req.query.timeFilter || "all";
                const station = mapRoleToStation(payload.role);
                if (!station) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Worker Role for station access",
                    });
                }
                const result = yield workerService.getIncomingOrders(station, page, limit, sortBy, timeFilter);
                res.json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    },
    getJobHistory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const sortBy = req.query.sortBy || "desc";
                const timeFilter = req.query.timeFilter || "all";
                const result = yield workerService.getWorkerHistory(payload.userId, page, limit, sortBy, timeFilter);
                res.json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    },
    processOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const parsed = processOrderSchema.safeParse(req.body);
                if (!parsed.success) {
                    return res.status(400).json({
                        success: false,
                        message: "Validation Error",
                        errors: parsed.error.issues,
                    });
                }
                const { orderId, station, items } = parsed.data;
                const result = yield workerService.processStationOrder({
                    workerId: payload.userId,
                    orderId,
                    station,
                    items,
                });
                res.json({
                    success: true,
                    message: "Order processed successfully",
                    data: result,
                });
            }
            catch (error) {
                // QTY_MISMATCH: frontend akan buka BypassModal
                if (error.message === "QTY_MISMATCH") {
                    return res.status(400).json({
                        success: false,
                        message: "QTY_MISMATCH",
                        details: error.details || [],
                    });
                }
                // ORDER_ON_HOLD: ada bypass PENDING, order tidak bisa diproses
                if (error.message === "ORDER_ON_HOLD") {
                    return res.status(400).json({
                        success: false,
                        message: "Order is on hold. There is a pending bypass request waiting for admin approval.",
                    });
                }
                if (error.message === "ORDER_NOT_FOUND") {
                    return res.status(404).json({
                        success: false,
                        message: "Order not found",
                    });
                }
                next(error);
            }
        });
    },
};
function mapRoleToStation(role) {
    if (role === client_1.EmployeeRole.WORKER_WASHING)
        return client_1.StationType.WASHING;
    if (role === client_1.EmployeeRole.WORKER_IRONING)
        return client_1.StationType.IRONING;
    if (role === client_1.EmployeeRole.WORKER_PACKING)
        return client_1.StationType.PACKING;
    return null;
}
