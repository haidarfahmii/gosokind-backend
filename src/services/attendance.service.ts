import { prisma } from "../lib/prisma";

export const clockIn = async (employeeId: string) => {
  // Check if already clocked in for the day?
  // Simply creating a new record for now as per minimal requirements. 
  // Ideally check for existing open attendance.
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today already clocked in?
  // Optional business rule, but safer to prevent duplicates if simple logic.
  // "Implement attendance logic (Clock In/Out) based on rules" - rules file was empty.
  // Assumption: One clock-in per day or multiple shifts allowed? 
  // Let's assume multiple shifts allowed but check if there is an OPEN one.

  const openAttendance = await prisma.attendance.findFirst({
    where: {
        employeeId,
        clockOut: null
    }
  });

  if (openAttendance) {
    throw new Error("ALREADY_CLOCKED_IN");
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
