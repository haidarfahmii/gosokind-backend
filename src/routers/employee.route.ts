import { Router } from "express";
import { employeeController } from "../controllers/employee.controller";
import {
  createEmployeeValidator,
  updateEmployeeValidator,
  getEmployeeByIdValidator,
  deleteEmployeeValidator,
  getAllEmployeesValidator,
  getAllCustomersValidator,
  toggleStatusValidator,
} from "../validators/employee.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { verifyToken } from "../middlewares/verify.token.middleware";
import {
  verifySuperAdmin,
  verifyAdmin,
} from "../middlewares/verify.role.middleware";
import { JWT_SECRET } from "../config/index.config";

const router = Router();

// Middleware global untuk semua routes employee
router.use(verifyToken(JWT_SECRET!));

router.post(
  "/",
  verifySuperAdmin(true),
  createEmployeeValidator,
  expressValidator,
  employeeController.createEmployee,
);

router.get(
  "/",
  verifyAdmin(false),
  getAllEmployeesValidator,
  expressValidator,
  employeeController.getAllEmployees,
);

router.get(
  "/customers",
  verifyAdmin(false),
  getAllCustomersValidator,
  expressValidator,
  employeeController.getAllCustomers,
);

router.get(
  "/:id",
  verifyAdmin(false),
  getEmployeeByIdValidator,
  expressValidator,
  employeeController.getEmployeeById,
);

router.put(
  "/:id",
  verifySuperAdmin(true),
  updateEmployeeValidator,
  expressValidator,
  employeeController.updateEmployee,
);

router.patch(
  "/:id/toggle-status",
  verifySuperAdmin(true),
  toggleStatusValidator,
  expressValidator,
  employeeController.toggleEmployeeStatus,
);

router.delete(
  "/:id",
  verifySuperAdmin(true),
  deleteEmployeeValidator,
  expressValidator,
  employeeController.deleteEmployee,
);

export default router;
