import { Router } from "express";
import { laundryItemController } from "../controllers/laundry-item.controller";
import {
  createLaundryItemValidator,
  updateLaundryItemValidator,
  getLaundryItemByIdValidator,
  deleteLaundryItemValidator,
  getAllLaundryItemsValidator,
} from "../validators/laundry-item.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { verifyToken } from "../middlewares/verify.token.middleware";
import {
  verifySuperAdmin,
  verifyAdmin,
} from "../middlewares/verify.role.middleware";
import { JWT_SECRET } from "../config/index.config";

const router = Router();

// Middleware global: Semua route memerlukan JWT token dan Admin role
router.use(verifyToken(JWT_SECRET!));

router.get(
  "/categories",
  verifyAdmin(false),
  laundryItemController.getCategories,
);

router.get(
  "/popular",
  verifyAdmin(false), // Semua admin/worker bisa lihat
  laundryItemController.getPopularItems,
);

router.get(
  "/",
  verifyAdmin(false),
  getAllLaundryItemsValidator,
  expressValidator,
  laundryItemController.getAllLaundryItems,
);

router.post(
  "/",
  verifyAdmin(true),
  createLaundryItemValidator,
  expressValidator,
  laundryItemController.createLaundryItem,
);

router.get(
  "/:id",
  verifyAdmin(false),
  getLaundryItemByIdValidator,
  expressValidator,
  laundryItemController.getLaundryItemById,
);

router.put(
  "/:id",
  verifyAdmin(true),
  updateLaundryItemValidator,
  expressValidator,
  laundryItemController.updateLaundryItem,
);

router.delete(
  "/:id",
  verifySuperAdmin(true),
  deleteLaundryItemValidator,
  expressValidator,
  laundryItemController.deleteLaundryItem,
);

export default router;
