import { Router } from "express";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { addressController } from "../controllers/address.controller";
import { JWT_SECRET } from "../config/index.config";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { createAddressValidator, updateAddressValidator } from "../validators/address.validator";

const router = Router();

// Middleware Auth Global untuk router ini (Hanya logged-in user)
router.use(verifyToken(JWT_SECRET!));

// GET /api/addresses - List semua alamat user
router.get("/", addressController.getAll);

// GET /api/addresses/:id - Detail alamat
router.get("/:id", addressController.getOne);

// POST /api/addresses - Tambah alamat baru
router.post(
    "/",
    createAddressValidator,
    expressValidator,
    addressController.create
);

// PATCH /api/addresses/:id - Edit alamat
router.patch(
    "/:id",
    updateAddressValidator,
    expressValidator,
    addressController.update
);

// PATCH /api/addresses/:id/primary - Set alamat jadi utama (shortcut)
router.patch(
    "/:id/primary",
    addressController.setPrimary
);

// DELETE /api/addresses/:id - Hapus alamat (soft delete)
router.delete("/:id", addressController.delete);

export default router;