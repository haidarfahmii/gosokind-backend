"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_auth_controller_1 = require("../controllers/employee-auth.controller");
const auth_validator_1 = require("../validators/auth.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const router = (0, express_1.Router)();
router.post("/login", auth_validator_1.loginValidator, express_validator_middleware_1.expressValidator, employee_auth_controller_1.employeeAuthController.login);
exports.default = router;
