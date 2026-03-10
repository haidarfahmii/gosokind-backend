import prisma from "../config/prisma.config";
import { getDistance } from "geolib";

const MAX_DISTANCE = 1000000; // meters (50 km)

// --- PUBLIC METHODS ---

export const clockIn = async (userId: string, lat: number, long: number) => {
  const employee = await validateEmployeeAndOutlet(userId);
  console.log(
    `[Attendance] Employee: ${employee.fullName} (${employee.role}), Coords: lat=${lat}, lng=${long}`,
  );
  validateLocation(lat, long, employee.outlet);
  await ensureNoActiveShift(userId);

  // MAX ATTENDANCE LOGIC: Limit to 2 shifts per day
  const { start, end } = getDayRange(new Date());
  const todayShiftsCount = await prisma.attendance.count({
    where: {
      employeeId: userId,
      date: { gte: start, lte: end },
    },
  });

  if (todayShiftsCount >= 2) {
    throw new Error("MAX_ATTENDANCE_REACHED");
  }

  return await prisma.attendance.create({
    data: {
      employeeId: userId,
      date: new Date(),
      clockIn: new Date(),
    },
  });
};

export const clockOut = async (userId: string) => {
  const activeShift = await getActiveShift(userId);

  return await prisma.attendance.update({
    where: { id: activeShift.id },
    data: { clockOut: new Date() },
  });
};

export const getDashboardData = async (employeeId: string, date?: string) => {
  const targetDate = date ? new Date(date) : new Date();
  const { start, end } = getDayRange(new Date(targetDate));

  // 1. Get Today's Latest Attendance (or any active unfinished shift)
  const todayShift = await prisma.attendance.findFirst({
    where: {
      employeeId,
      OR: [{ date: { gte: start, lte: end } }, { clockOut: null }],
    },
    orderBy: { clockIn: "desc" },
  });

  // 2. Count Total Unique Days Worked
  const totalDaysGroup = await prisma.attendance.groupBy({
    by: ["date"],
    where: { employeeId },
  });
  const daysWorked = totalDaysGroup.length;

  // 3. Calc Duration (if clocked out)
  let shiftDuration = null;
  if (todayShift?.clockOut) {
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
};

export const getAllAttendance = async (
  outletId: string,
  page: number,
  limit: number,
  date?: string,
) => {
  const whereClause = buildWhereClause(outletId, date);

  const [data, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: whereClause,
      include: { employee: true },
      orderBy: { clockIn: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendance.count({ where: whereClause }),
  ]);

  return {
    data,
    meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
  };
};

export const getEmployeeHistory = async (
  employeeId: string,
  page: number,
  limit: number,
  date?: string,
) => {
  const whereClause: any = { employeeId };
  if (date) {
    const { start, end } = getDayRange(new Date(date));
    whereClause.date = { gte: start, lte: end };
  }

  const [data, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: whereClause,
      orderBy: { clockIn: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendance.count({ where: whereClause }),
  ]);

  return {
    data,
    meta: { page, limit, total, lastPage: Math.ceil(total / limit) || 1 },
  };
};

// --- PRIVATE HELPERS ---

const getDayRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const buildWhereClause = (outletId: string, dateStr?: string) => {
  const where: any = { employee: { outletId } };
  if (dateStr) {
    const { start, end } = getDayRange(new Date(dateStr));
    where.date = { gte: start, lte: end };
  }
  return where;
};

const validateEmployeeAndOutlet = async (userId: string) => {
  const emp = await prisma.employee.findUnique({
    where: { id: userId, deletedAt: null },
    include: { outlet: true },
  });

  if (!emp) throw new Error("EMPLOYEE_NOT_FOUND");
  if (!emp.outlet) throw new Error("NO_OUTLET_ASSIGNED");

  return emp as typeof emp & { outlet: NonNullable<typeof emp.outlet> };
};

const validateLocation = (
  lat: number,
  long: number,
  outlet: { latitude: number; longitude: number },
) => {
  const dist = getDistance(
    { latitude: lat, longitude: long },
    { latitude: outlet.latitude, longitude: outlet.longitude },
  );
  console.log(
    `[Attendance] Distance: ${dist}m, Max: ${MAX_DISTANCE}m, Outlet: ${outlet.latitude},${outlet.longitude}`,
  );
  if (dist > MAX_DISTANCE) throw new Error("OUT_OF_RANGE");
};

const ensureNoActiveShift = async (userId: string) => {
  const active = await prisma.attendance.findFirst({
    where: { employeeId: userId, clockOut: null },
  });
  if (active) throw new Error("ALREADY_CLOCKED_IN");
};

const getActiveShift = async (userId: string) => {
  const active = await prisma.attendance.findFirst({
    where: { employeeId: userId, clockOut: null },
  });
  if (!active) throw new Error("NOT_CLOCKED_IN");
  return active;
};
