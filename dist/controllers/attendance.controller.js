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
exports.getDashboard = exports.clockOut = exports.clockIn = void 0;
const zod_1 = require("zod");
const attendanceService = __importStar(require("../services/attendance.service"));
const attendanceSchema = zod_1.z.object({
    employeeId: zod_1.z.string(),
    latitude: zod_1.z.number().optional(), // should i??
    longitude: zod_1.z.number().optional(),
});
const clockIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId, latitude, longitude } = attendanceSchema.parse(req.body);
        if (latitude === undefined || longitude === undefined) {
            res.status(400).json({ success: false, message: "Latitude and Longitude are required." });
            return;
        }
        const result = yield attendanceService.clockIn(employeeId, latitude, longitude);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        if (error.message === "ALREADY_CLOCKED_IN") {
            res.status(400).json({ success: false, message: "User is already clocked in." });
            return;
        }
        if (error.message === "OUT_OF_RANGE") {
            res.status(400).json({ success: false, message: "You are too far from the outlet." });
            return;
        }
        if (error.message === "MULTIPLE_SHIFTS_NOT_ALLOWED") {
            res.status(400).json({ success: false, message: "Multiple shifts are not allowed." });
            return;
        }
        handleError(error, res);
    }
});
exports.clockIn = clockIn;
const clockOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = attendanceSchema.parse(req.body);
        const result = yield attendanceService.clockOut(employeeId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        if (error.message === "NOT_CLOCKED_IN") {
            res.status(400).json({ success: false, message: "User is not clocked in." });
            return;
        }
        handleError(error, res);
    }
});
exports.clockOut = clockOut;
const getDashboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employeeId = req.query.employeeId;
        if (!employeeId) {
            res.status(400).json({ success: false, message: "Employee ID is required." });
            return;
        }
        const data = yield attendanceService.getDashboardData(employeeId);
        res.json({ success: true, data });
    }
    catch (error) {
        handleError(error, res);
    }
});
exports.getDashboard = getDashboard;
function handleError(error, res) {
    if (error instanceof zod_1.z.ZodError) {
        res.status(400).json({ success: false, message: "Validation Error", errors: error.errors });
        return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
}
