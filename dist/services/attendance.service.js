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
exports.getEmployeeHistory = exports.getAllAttendance = exports.getDashboardData = exports.clockOut = exports.clockIn = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const geolib_1 = require("geolib");
const MAX_DISTANCE = 100000; // meters (50 km)
// --- PUBLIC METHODS ---
const clockIn = (userId, lat, long) => __awaiter(void 0, void 0, void 0, function* () {
    const employee = yield validateEmployeeAndOutlet(userId);
    console.log(`[Attendance] Employee: ${employee.fullName} (${employee.role}), Coords: lat=${lat}, lng=${long}`);
    validateLocation(lat, long, employee.outlet);
    yield ensureNoActiveShift(userId);
    return yield prisma_config_1.default.attendance.create({
        data: {
            employeeId: userId,
            date: new Date(),
            clockIn: new Date(),
        },
    });
});
exports.clockIn = clockIn;
const clockOut = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const activeShift = yield getActiveShift(userId);
    return yield prisma_config_1.default.attendance.update({
        where: { id: activeShift.id },
        data: { clockOut: new Date() },
    });
});
exports.clockOut = clockOut;
const getDashboardData = (employeeId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const targetDate = date ? new Date(date) : new Date();
    const { start, end } = getDayRange(new Date(targetDate));
    // 1. Get Today's Latest Attendance (or any active unfinished shift)
    const todayShift = yield prisma_config_1.default.attendance.findFirst({
        where: {
            employeeId,
            OR: [{ date: { gte: start, lte: end } }, { clockOut: null }],
        },
        orderBy: { clockIn: "desc" },
    });
    // 2. Count Total Unique Days Worked
    const totalDaysGroup = yield prisma_config_1.default.attendance.groupBy({
        by: ["date"],
        where: { employeeId },
    });
    const daysWorked = totalDaysGroup.length;
    // 3. Calc Duration (if clocked out)
    let shiftDuration = null;
    if (todayShift === null || todayShift === void 0 ? void 0 : todayShift.clockOut) {
        const diff = todayShift.clockOut.getTime() - todayShift.clockIn.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        shiftDuration = `${hours}h ${minutes}m`;
    }
    return {
        todayAttendance: todayShift,
        shiftDuration,
        daysWorked,
    };
});
exports.getDashboardData = getDashboardData;
const getAllAttendance = (outletId, page, limit, date) => __awaiter(void 0, void 0, void 0, function* () {
    const whereClause = buildWhereClause(outletId, date);
    const [data, total] = yield prisma_config_1.default.$transaction([
        prisma_config_1.default.attendance.findMany({
            where: whereClause,
            include: { employee: true },
            orderBy: { clockIn: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_config_1.default.attendance.count({ where: whereClause }),
    ]);
    return {
        data,
        meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
    };
});
exports.getAllAttendance = getAllAttendance;
const getEmployeeHistory = (employeeId, page, limit, date) => __awaiter(void 0, void 0, void 0, function* () {
    const whereClause = { employeeId };
    if (date) {
        const { start, end } = getDayRange(new Date(date));
        whereClause.date = { gte: start, lte: end };
    }
    const [data, total] = yield prisma_config_1.default.$transaction([
        prisma_config_1.default.attendance.findMany({
            where: whereClause,
            orderBy: { clockIn: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_config_1.default.attendance.count({ where: whereClause }),
    ]);
    return {
        data,
        meta: { page, limit, total, lastPage: Math.ceil(total / limit) || 1 },
    };
});
exports.getEmployeeHistory = getEmployeeHistory;
// --- PRIVATE HELPERS ---
const getDayRange = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};
const buildWhereClause = (outletId, dateStr) => {
    const where = { employee: { outletId } };
    if (dateStr) {
        const { start, end } = getDayRange(new Date(dateStr));
        where.date = { gte: start, lte: end };
    }
    return where;
};
const validateEmployeeAndOutlet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const emp = yield prisma_config_1.default.employee.findUnique({
        where: { id: userId, deletedAt: null },
        include: { outlet: true },
    });
    if (!emp)
        throw new Error("EMPLOYEE_NOT_FOUND");
    if (!emp.outlet)
        throw new Error("NO_OUTLET_ASSIGNED");
    return emp;
});
const validateLocation = (lat, long, outlet) => {
    const dist = (0, geolib_1.getDistance)({ latitude: lat, longitude: long }, { latitude: outlet.latitude, longitude: outlet.longitude });
    console.log(`[Attendance] Distance: ${dist}m, Max: ${MAX_DISTANCE}m, Outlet: ${outlet.latitude},${outlet.longitude}`);
    if (dist > MAX_DISTANCE)
        throw new Error("OUT_OF_RANGE");
};
const ensureNoActiveShift = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const active = yield prisma_config_1.default.attendance.findFirst({
        where: { employeeId: userId, clockOut: null },
    });
    if (active)
        throw new Error("ALREADY_CLOCKED_IN");
});
const getActiveShift = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const active = yield prisma_config_1.default.attendance.findFirst({
        where: { employeeId: userId, clockOut: null },
    });
    if (!active)
        throw new Error("NOT_CLOCKED_IN");
    return active;
});
