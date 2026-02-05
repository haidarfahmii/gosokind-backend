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
exports.getDashboardData = exports.clockOut = exports.clockIn = void 0;
const prisma_1 = require("../lib/prisma");
// Helper to calculate distance in meters
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius of the earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in meters
    return d;
}
const MAX_DISTANCE_METERS = 100; // Allow 100m radius
const clockIn = (employeeId, latitude, longitude) => __awaiter(void 0, void 0, void 0, function* () {
    // 0. Check Geofencing
    const employee = yield prisma_1.prisma.employee.findUnique({
        where: { id: employeeId },
        include: { outlet: true },
    });
    if (!employee)
        throw new Error("EMPLOYEE_NOT_FOUND");
    if (!employee.outlet)
        throw new Error("NO_OUTLET_ASSIGNED");
    const distance = getDistanceFromLatLonInMeters(latitude, longitude, employee.outlet.latitude, employee.outlet.longitude);
    if (distance > MAX_DISTANCE_METERS) {
        throw new Error("OUT_OF_RANGE");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 1. Check if user currently has an OPEN shift (clockIn but no clockOut)
    // This prevents concurrent shifts (even from previous days)
    const openAttendance = yield prisma_1.prisma.attendance.findFirst({
        where: {
            employeeId,
            clockOut: null,
        },
    });
    if (openAttendance) {
        throw new Error("ALREADY_CLOCKED_IN");
    }
    // 2. Check if user ALREADY completed a shift today
    // "Multiple shift is not allowed" -> One record per day max
    const todayAttendance = yield prisma_1.prisma.attendance.findFirst({
        where: {
            employeeId,
            date: today,
        },
    });
    if (todayAttendance) {
        throw new Error("MULTIPLE_SHIFTS_NOT_ALLOWED");
    }
    return yield prisma_1.prisma.attendance.create({
        data: {
            employeeId,
            date: new Date(), // Using current date for the Date field
            clockIn: new Date(),
        },
    });
});
exports.clockIn = clockIn;
const clockOut = (employeeId) => __awaiter(void 0, void 0, void 0, function* () {
    const openAttendance = yield prisma_1.prisma.attendance.findFirst({
        where: {
            employeeId,
            clockOut: null,
        },
    });
    if (!openAttendance) {
        throw new Error("NOT_CLOCKED_IN");
    }
    return yield prisma_1.prisma.attendance.update({
        where: {
            id: openAttendance.id,
        },
        data: {
            clockOut: new Date(),
        },
    });
});
exports.clockOut = clockOut;
const getDashboardData = (employeeId) => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecord = yield prisma_1.prisma.attendance.findFirst({
        where: {
            employeeId,
            date: today,
        },
    });
    const openRecord = yield prisma_1.prisma.attendance.findFirst({
        where: {
            employeeId,
            clockOut: null,
        },
    });
    // Determine status
    let status = "ABSENT";
    // Logic: 
    // If openRecord exists -> "CLOCKED_IN" (or WORKING)
    // If todayRecord exists and has clockOut -> "COMPLETED"
    // If no record today -> "ABSENT" (or NOT_STARTED)
    if (openRecord) {
        status = "CLOCKED_IN";
    }
    else if (todayRecord === null || todayRecord === void 0 ? void 0 : todayRecord.clockOut) {
        status = "COMPLETED";
    }
    const totalDays = yield prisma_1.prisma.attendance.count({
        where: { employeeId },
    });
    const history = yield prisma_1.prisma.attendance.findMany({
        where: { employeeId },
        take: 5,
        orderBy: { date: "desc" },
    });
    return {
        today: {
            status,
            clockIn: (todayRecord === null || todayRecord === void 0 ? void 0 : todayRecord.clockIn) || (openRecord === null || openRecord === void 0 ? void 0 : openRecord.clockIn) || null,
            clockOut: (todayRecord === null || todayRecord === void 0 ? void 0 : todayRecord.clockOut) || null,
        },
        summary: {
            totalDays,
        },
        history,
    };
});
exports.getDashboardData = getDashboardData;
