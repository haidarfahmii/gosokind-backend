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
exports.processOrder = void 0;
const zod_1 = require("zod");
const workerService = __importStar(require("../services/worker.service"));
const client_1 = require("../generated/prisma/client");
const processOrderSchema = zod_1.z.object({
    orderId: zod_1.z.string(),
    workerId: zod_1.z.string(),
    station: zod_1.z.nativeEnum(client_1.StationType),
    items: zod_1.z.array(zod_1.z.object({
        laundryItemId: zod_1.z.string(),
        quantity: zod_1.z.number().int().nonnegative(),
    })),
});
const processOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = processOrderSchema.parse(req.body);
        const result = yield workerService.processStationOrder(payload);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) { // Type 'any' used to safely access message property
        if (error.message === "QTY_MISMATCH") {
            res.status(400).json({
                success: false,
                code: "QTY_MISMATCH",
                message: "Quantity mismatch between input and system records.",
            });
            return; // Ensure return
        }
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validation Error",
                errors: error.errors,
            });
            return;
        }
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
exports.processOrder = processOrder;
