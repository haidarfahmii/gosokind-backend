import { EmployeeRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      // Dari verifyToken middleware
      employeeId?: string;
      employeeRole?: EmployeeRole;
      customerId?: string;

      // Dari verifyOutletScope middleware
      isSuperAdmin?: boolean;
      scopedOutletId?: string;
    }
  }
}

export {};
