import { EmployeeRole } from "@prisma/client";

export interface CreateEmployeeInput {
  email: string;
  password: string;
  fullName: string;
  role: EmployeeRole;
  outletId?: string;
  isActive?: boolean;
}

export interface UpdateEmployeeInput {
  email?: string;
  password?: string;
  fullName?: string;
  role?: EmployeeRole;
  outletId?: string | null;
  isActive?: boolean;
}

export interface EmployeeResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: EmployeeRole;
  outletId: string | null;
  outletName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  role?: EmployeeRole;
  outletId?: string;
  search?: string;
  isActive?: boolean;
}

export interface ToggleStatusInput {
  isActive: boolean;
}

export interface EmployeeLoginInput {
  email: string;
  password: string;
}

export interface EmployeeAuthResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: EmployeeRole;
    avatarUrl: string | null;
    outletId: string | null;
    outletName?: string;
  };
}

export interface CustomerListQuery {
  page?: number;
  limit?: number;
  search?: string;
}
