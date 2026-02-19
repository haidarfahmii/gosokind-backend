import { Router } from "express";
import { outletController } from "../controllers/outlet.controller";
import {
  createOutletValidator,
  updateOutletValidator,
  deleteOutletValidator,
  getOutletByIdValidator,
  getAllOutletsValidator,
  checkLocationValidator,
  calculateShippingValidator,
} from "../validators/outlet.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { verifyToken } from "../middlewares/verify.token.middleware";
import {
  verifySuperAdmin,
  verifyAdmin,
} from "../middlewares/verify.role.middleware";
import { verifyOutletScope } from "../middlewares/verify.outlet.scope.middleware";
import { JWT_SECRET } from "../config/index.config";

const router = Router();

// Middleware global: Semua route memerlukan JWT token
router.use(verifyToken(JWT_SECRET!));
router.use(verifyOutletScope());

router.get(
  "/",
  verifyAdmin(false),
  getAllOutletsValidator,
  expressValidator,
  outletController.getAllOutlets,
);

router.post(
  "/check-location",
  verifySuperAdmin(true),
  checkLocationValidator,
  expressValidator,
  outletController.checkLocation,
);

router.get(
  "/:id",
  verifyAdmin(false),
  getOutletByIdValidator,
  expressValidator,
  outletController.getOutletById,
);

router.post(
  "/",
  verifySuperAdmin(true),
  createOutletValidator,
  expressValidator,
  outletController.createOutlet,
);

router.put(
  "/:id",
  verifySuperAdmin(true),
  updateOutletValidator,
  expressValidator,
  outletController.updateOutlet,
);

router.delete(
  "/:id",
  verifySuperAdmin(true),
  deleteOutletValidator,
  expressValidator,
  outletController.deleteOutlet,
);

router.post(
  "/:outletId/calculate-shipping",
  verifyAdmin(false),
  calculateShippingValidator,
  expressValidator,
  outletController.calculateShipping,
);

export default router;
