import { prisma } from "../lib/prisma";
import { getDistance } from "geolib"; 

const MAX_DISTANCE = 100; // meters

// --- PUBLIC METHODS ---

export const clockIn = async (userId: string, lat: number, long: number) => {
  const employee = await validateEmployeeAndOutlet(userId);
  validateLocation(lat, long, employee.outlet);
  await ensureNoActiveShift(userId);

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
    const { start, end } = getDayRange(targetDate);

    return await prisma.attendance.findMany({
        where: { employeeId, date: { gte: start, lte: end } },
        orderBy: { clockIn: 'desc' }
    });
};

export const getAllAttendance = async (outletId: string, page: number, limit: number, date?: string) => {
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

  return { data, meta: { page, limit, total, lastPage: Math.ceil(total / limit) } };
};

// --- PRIVATE HELPERS (Atomic & Reusable) ---

const getDayRange = (date: Date) => {
  const start = new Date(date.setHours(0, 0, 0, 0));
  const end = new Date(date.setHours(23, 59, 59, 999));
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
    where: { id: userId },
    include: { outlet: true },
  });
  
  if (!emp) throw new Error("EMPLOYEE_NOT_FOUND");
  if (!emp.outlet) throw new Error("NO_OUTLET_ASSIGNED");
  
  return emp as (typeof emp & { outlet: NonNullable<typeof emp.outlet> });
};

const validateLocation = (lat: number, long: number, outlet: { latitude: number; longitude: number }) => {
  const dist = getDistance(
    { latitude: lat, longitude: long },
    { latitude: outlet.latitude, longitude: outlet.longitude }
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