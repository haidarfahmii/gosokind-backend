"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const laundry_item_controller_1 = require("../controllers/laundry-item.controller");
const laundry_item_validator_1 = require("../validators/laundry-item.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const verify_role_middleware_1 = require("../middlewares/verify.role.middleware");
const index_config_1 = require("../config/index.config");
const router = (0, express_1.Router)();
// Middleware global: Semua route memerlukan JWT token dan Admin role
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
router.get("/categories", (0, verify_role_middleware_1.verifyAdmin)(false), laundry_item_controller_1.laundryItemController.getCategories);
router.get("/popular", (0, verify_role_middleware_1.verifyAdmin)(false), // Semua admin/worker bisa lihat
laundry_item_controller_1.laundryItemController.getPopularItems);
router.get("/", (0, verify_role_middleware_1.verifyAdmin)(false), laundry_item_validator_1.getAllLaundryItemsValidator, express_validator_middleware_1.expressValidator, laundry_item_controller_1.laundryItemController.getAllLaundryItems);
router.post("/", (0, verify_role_middleware_1.verifyAdmin)(true), laundry_item_validator_1.createLaundryItemValidator, express_validator_middleware_1.expressValidator, laundry_item_controller_1.laundryItemController.createLaundryItem);
router.get("/:id", (0, verify_role_middleware_1.verifyAdmin)(false), laundry_item_validator_1.getLaundryItemByIdValidator, express_validator_middleware_1.expressValidator, laundry_item_controller_1.laundryItemController.getLaundryItemById);
router.put("/:id", (0, verify_role_middleware_1.verifyAdmin)(true), laundry_item_validator_1.updateLaundryItemValidator, express_validator_middleware_1.expressValidator, laundry_item_controller_1.laundryItemController.updateLaundryItem);
router.delete("/:id", (0, verify_role_middleware_1.verifySuperAdmin)(true), laundry_item_validator_1.deleteLaundryItemValidator, express_validator_middleware_1.expressValidator, laundry_item_controller_1.laundryItemController.deleteLaundryItem);
exports.default = router;
