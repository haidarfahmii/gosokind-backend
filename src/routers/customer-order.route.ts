import { Router } from "express";
import { combinedOrderController as orderController } from "../controllers/order";
import { createOrderByCustomerValidator } from "../validators/order.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { JWT_SECRET } from "../config/index.config";

const router = Router();

router.use(verifyToken(JWT_SECRET!));

// POST /api/customer/orders - Create new order
router.post(
  "/",
  createOrderByCustomerValidator,
  expressValidator,
  orderController.createOrderByCustomer,
);

// GET /api/customer/orders - Get customer's orders
router.get("/", orderController.getOrdersByCustomer);

// GET /api/customer/orders/:id - Get order detail
router.get("/:id", orderController.getOrderById);

router.get("/number/:orderNumber", orderController.getOrderByOrderNumber);

// PATCH /api/customer/orders/:id/confirm-delivery
router.patch("/:id/confirm-delivery", orderController.confirmDelivery);

export default router;
