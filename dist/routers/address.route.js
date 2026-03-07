"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const address_controller_1 = require("../controllers/address.controller");
const index_config_1 = require("../config/index.config");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const address_validator_1 = require("../validators/address.validator");
const router = (0, express_1.Router)();
// Middleware Auth Global untuk router ini (Hanya logged-in user)
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
// GET /api/addresses - List semua alamat user
router.get("/", address_controller_1.addressController.getAll);
// GET /api/addresses/:id - Detail alamat
router.get("/:id", address_controller_1.addressController.getOne);
// POST /api/addresses - Tambah alamat baru
router.post("/", address_validator_1.createAddressValidator, express_validator_middleware_1.expressValidator, address_controller_1.addressController.create);
// PATCH /api/addresses/:id - Edit alamat
router.patch("/:id", address_validator_1.updateAddressValidator, express_validator_middleware_1.expressValidator, address_controller_1.addressController.update);
// PATCH /api/addresses/:id/primary - Set alamat jadi utama (shortcut)
router.patch("/:id/primary", address_controller_1.addressController.setPrimary);
// DELETE /api/addresses/:id - Hapus alamat (soft delete)
router.delete("/:id", address_controller_1.addressController.delete);
exports.default = router;
