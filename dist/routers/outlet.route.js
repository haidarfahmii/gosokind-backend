"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const outlet_controller_1 = require("../controllers/outlet.controller");
const outlet_validator_1 = require("../validators/outlet.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const verify_role_middleware_1 = require("../middlewares/verify.role.middleware");
const verify_outlet_scope_middleware_1 = require("../middlewares/verify.outlet.scope.middleware");
const index_config_1 = require("../config/index.config");
const router = (0, express_1.Router)();
// Middleware global: Semua route memerlukan JWT token
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
router.use((0, verify_outlet_scope_middleware_1.verifyOutletScope)());
router.get("/", (0, verify_role_middleware_1.verifyAdmin)(false), outlet_validator_1.getAllOutletsValidator, express_validator_middleware_1.expressValidator, outlet_controller_1.outletController.getAllOutlets);
// Khusus dropdown/select
router.get("/all", (0, verify_role_middleware_1.verifyAdmin)(false), outlet_controller_1.outletController.getAllOutletsForDropdown);
router.get("/:id", (0, verify_role_middleware_1.verifyAdmin)(false), outlet_validator_1.getOutletByIdValidator, express_validator_middleware_1.expressValidator, outlet_controller_1.outletController.getOutletById);
router.post("/", (0, verify_role_middleware_1.verifySuperAdmin)(true), outlet_validator_1.createOutletValidator, express_validator_middleware_1.expressValidator, outlet_controller_1.outletController.createOutlet);
router.put("/:id", (0, verify_role_middleware_1.verifySuperAdmin)(true), outlet_validator_1.updateOutletValidator, express_validator_middleware_1.expressValidator, outlet_controller_1.outletController.updateOutlet);
router.delete("/:id", (0, verify_role_middleware_1.verifySuperAdmin)(true), outlet_validator_1.deleteOutletValidator, express_validator_middleware_1.expressValidator, outlet_controller_1.outletController.deleteOutlet);
router.post("/:outletId/calculate-shipping", (0, verify_role_middleware_1.verifyAdmin)(false), outlet_validator_1.calculateShippingValidator, express_validator_middleware_1.expressValidator, outlet_controller_1.outletController.calculateShipping);
exports.default = router;
