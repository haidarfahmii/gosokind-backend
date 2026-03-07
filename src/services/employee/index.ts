import { createEmployee } from "./employee-create.service";
import {
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
} from "./employee-update.service";
import {
  getAllEmployees,
  getEmployeeById,
  getEmployeeStats,
} from "./employee-query.service";
import {
  getAllCustomers,
  getEmployeeHistory,
} from "./employee-customer.service";

export const employeeService = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeStats,
  updateEmployee,
  deleteEmployee,
  getAllCustomers,
  toggleEmployeeStatus,
  getEmployeeHistory,
};
