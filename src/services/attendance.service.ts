import { prisma } from "../lib/prisma";

// Helper to calculate distance in meters
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in meters
  return d;
}

const MAX_DISTANCE_METERS = 100; // Allow 100m radius

export const clockIn = async (employeeId: string, latitude: number, longitude: number) => {
  // 0. Check Geofencing
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { outlet: true },
  });

  if (!employee) throw new Error("EMPLOYEE_NOT_FOUND");
  if (!employee.outlet) throw new Error("NO_OUTLET_ASSIGNED");

  const distance = getDistanceFromLatLonInMeters(
    latitude,
    longitude,
    employee.outlet.latitude,
    employee.outlet.longitude
  );

  if (distance > MAX_DISTANCE_METERS) {
    throw new Error("OUT_OF_RANGE");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Check if user currently has an OPEN shift (clockIn but no clockOut)
  // This prevents concurrent shifts (even from previous days)
  const openAttendance = await prisma.attendance.findFirst({
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
  const todayAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId,
      date: today,
    },
  });

  if (todayAttendance) {
    throw new Error("MULTIPLE_SHIFTS_NOT_ALLOWED");
  }

  return await prisma.attendance.create({
    data: {
      employeeId,
      date: new Date(), // Using current date for the Date field
      clockIn: new Date(),
    },
  });
};

export const clockOut = async (employeeId: string) => {
  const openAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId,
      clockOut: null,
    },
  });

  if (!openAttendance) {
    throw new Error("NOT_CLOCKED_IN");
  }

  return await prisma.attendance.update({
    where: {
      id: openAttendance.id,
    },
    data: {
      clockOut: new Date(),
    },
  });
};

export const getDashboardData = async (employeeId: string, dateStr?: string) => {
  // 1. Current "Live" Status (For Swipe Button)
  const openRecord = await prisma.attendance.findFirst({
    where: {
      employeeId,
      clockOut: null,
    },
  });

  const isClockedIn = !!openRecord;

  // 2. Selected Date Data (For Cards & Activity List)
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  
  const endOfTargetDate = new Date(targetDate);
  endOfTargetDate.setHours(23, 59, 59, 999);

  // Find records for the specific target date
  const recordsForDate = await prisma.attendance.findMany({
    where: {
      employeeId,
      // Match records where the 'date' field falls within the target day
      // OR records created on that day (if date field isn't reliable, but we use 'date' field)
      date: {
        gte: targetDate,
        lte: endOfTargetDate
      }
    },
    orderBy: { clockIn: 'desc' }
  });

  // Summary for the selected date
  // Assuming simpler logic: usually one record per day, but finding the "Main" one if multiple
  const primaryRecord = recordsForDate[0] || null;

  let dailyStatus = "ABSENT";
  if (primaryRecord) {
    if (primaryRecord.clockOut) dailyStatus = "COMPLETED";
    else dailyStatus = "CLOCKED_IN"; // Or "ONGOING"
  }

  // Total summary (Global)
  const totalDays = await prisma.attendance.count({
    where: { employeeId },
  });

  return {
    currentStatus: {
      isClockedIn,
      clockInTime: openRecord?.clockIn || null,
    },
    selectedDate: {
      date: targetDate,
      status: dailyStatus,
      records: recordsForDate,
      summary: {
        clockIn: primaryRecord?.clockIn || null,
        clockOut: primaryRecord?.clockOut || null,
        totalDays,
      }
    }
  };
};
