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
exports.driverController = void 0;
const zod_1 = require("zod");
const driverService = __importStar(require("../services/driver.service"));
const orderIdSchema = zod_1.z.object({
    orderId: zod_1.z.string().cuid({ message: "Invalid Order ID format" }),
});
exports.driverController = {
    checkAvailability(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const result = yield driverService.checkAvailability(payload.userId);
                res.json({ success: true, data: result });
            }
            catch (error) {
                next(error);
            }
        });
    },
    getActiveJob(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const result = yield driverService.getDriverActiveJob(payload.userId);
                res.json({ success: true, data: result });
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
                const result = yield driverService.getDriverHistory(payload.userId, page, limit, sortBy, timeFilter);
                res.json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    },
    getAvailableJobs(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const sortBy = req.query.sortBy || "asc";
                const timeFilter = req.query.timeFilter || "all";
                const result = yield driverService.getAvailableJobs(page, limit, sortBy, timeFilter);
                res.json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    },
    acceptPickup(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const parsed = orderIdSchema.safeParse(req.body);
                if (!parsed.success) {
                    return res
                        .status(400)
                        .json({
                        success: false,
                        message: "Validation Error",
                        errors: parsed.error.issues,
                    });
                }
                yield driverService.acceptPickup(payload.userId, parsed.data.orderId);
                res.json({ success: true, message: "Pickup accepted successfully" });
            }
            catch (error) {
                handleDriverError(res, next, error);
            }
        });
    },
    completePickup(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const parsed = orderIdSchema.safeParse(req.body);
                if (!parsed.success) {
                    return res
                        .status(400)
                        .json({
                        success: false,
                        message: "Validation Error",
                        errors: parsed.error.issues,
                    });
                }
                yield driverService.completePickup(payload.userId, parsed.data.orderId);
                res.json({
                    success: true,
                    message: "Pickup completed. Laundry arrived at outlet.",
                });
            }
            catch (error) {
                handleDriverError(res, next, error);
            }
        });
    },
    acceptDelivery(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const parsed = orderIdSchema.safeParse(req.body);
                if (!parsed.success) {
                    return res
                        .status(400)
                        .json({
                        success: false,
                        message: "Validation Error",
                        errors: parsed.error.issues,
                    });
                }
                yield driverService.acceptDelivery(payload.userId, parsed.data.orderId);
                res.json({ success: true, message: "Delivery accepted successfully" });
            }
            catch (error) {
                handleDriverError(res, next, error);
            }
        });
    },
    completeDelivery(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = res.locals.payload;
                const parsed = orderIdSchema.safeParse(req.body);
                if (!parsed.success) {
                    return res
                        .status(400)
                        .json({
                        success: false,
                        message: "Validation Error",
                        errors: parsed.error.issues,
                    });
                }
                yield driverService.completeDelivery(payload.userId, parsed.data.orderId);
                res.json({ success: true, message: "Delivery completed successfully" });
            }
            catch (error) {
                handleDriverError(res, next, error);
            }
        });
    },
};
function handleDriverError(res, next, error) {
    const statusMap = {
        DRIVER_BUSY: 400,
        ORDER_UNAVAILABLE: 409,
        ORDER_NOT_FOUND_OR_INVALID: 404,
    };
    const status = statusMap[error.message];
    if (status) {
        return res.status(status).json({ success: false, message: error.message });
    }
    next(error);
}
