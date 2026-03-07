"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const employee_validator_1 = require("../validators/employee.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const verify_role_middleware_1 = require("../middlewares/verify.role.middleware");
const index_config_1 = require("../config/index.config");
const verify_outlet_scope_middleware_1 = require("../middlewares/verify.outlet.scope.middleware");
const router = (0, express_1.Router)();
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET)); // verify JWT Token
router.use((0, verify_outlet_scope_middleware_1.verifyOutletScope)()); // verify outlet scope
router.post("/", (0, verify_role_middleware_1.verifyAdmin)(false), employee_validator_1.createEmployeeValidator, express_validator_middleware_1.expressValidator, employee_controller_1.employeeController.createEmployee);
router.get("/", (0, verify_role_middleware_1.verifyAdmin)(false), employee_validator_1.getAllEmployeesValidator, express_validator_middleware_1.expressValidator, employee_controller_1.employeeController.getAllEmployees);
router.get("/customers", (0, verify_role_middleware_1.verifyAdmin)(false), employee_validator_1.getAllCustomersValidator, express_validator_middleware_1.expressValidator, employee_controller_1.employeeController.getAllCustomers);
router.get("/stats", (0, verify_role_middleware_1.verifyAdmin)(false), employee_controller_1.employeeController.getEmployeeStats);
router.get("/:id", (0, verify_role_middleware_1.verifyAdmin)(false), employee_validator_1.getEmployeeByIdValidator, express_validator_middleware_1.expressValidator, employee_controller_1.employeeController.getEmployeeById);
router.get("/:id/history", (0, verify_role_middleware_1.verifyAdmin)(false), employee_controller_1.employeeController.getEmployeeHistory);
router.put("/:id", (0, verify_role_middleware_1.verifyAdmin)(false), employee_validator_1.updateEmployeeValidator, express_validator_middleware_1.expressValidator, employee_controller_1.employeeController.updateEmployee);
router.patch("/:id/toggle-status", (0, verify_role_middleware_1.verifyAdmin)(false), employee_validator_1.toggleStatusValidator, express_validator_middleware_1.expressValidator, employee_controller_1.employeeController.toggleEmployeeStatus);
router.delete("/:id", (0, verify_role_middleware_1.verifySuperAdmin)(true), employee_validator_1.deleteEmployeeValidator, express_validator_middleware_1.expressValidator, employee_controller_1.employeeController.deleteEmployee);
exports.default = router;
