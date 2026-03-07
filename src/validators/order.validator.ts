import { body, query, param } from "express-validator";

// GET /api/orders - Get all orders
export const getAllOrdersValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("status")
    .optional()
    .isIn([
      "WAITING_FOR_PICKUP",
      "PICKUP_ON_THE_WAY",
      "ARRIVED_AT_OUTLET",
      "WASHING",
      "IRONING",
      "PACKING",
      "WAITING_FOR_PAYMENT",
      "READY_FOR_DELIVERY",
      "DELIVERY_ON_THE_WAY",
      "RECEIVED_BY_CUSTOMER",
      "COMPLETED",
    ])
    .withMessage("Invalid order status"),
  query("outletId")
    .optional()
    .isString()
    .withMessage("Outlet ID must be a string"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
];

// GET /api/orders/:id - Get order by ID
export const getOrderByIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
];

// GET /api/orders/number/:orderNumber - Get order by orderNumber
export const getOrderByOrderNumberValidator = [
  param("orderNumber")
    .notEmpty()
    .withMessage("Order number is required")
    .isString()
    .withMessage("Order number must be a string"),
  // .matches(/^INV-\d{8}\d+$/)
  // .withMessage("Invalid order number format"),
];

// POST /api/orders - Create order
export const createOrderValidator = [
  body("customerId")
    .notEmpty()
    .withMessage("Customer ID is required")
    .isString()
    .withMessage("Customer ID must be a string"),
  body("addressId")
    .notEmpty()
    .withMessage("Address ID is required")
    .isString()
    .withMessage("Address ID must be a string"),
  body("totalWeight")
    .notEmpty()
    .withMessage("Total weight is required")
    .isFloat({ min: 0.1 })
    .withMessage("Total weight must be at least 0.1 kg")
    .toFloat(),
  body("items")
    .notEmpty()
    .withMessage("Order items are required")
    .isArray({ min: 1 })
    .withMessage("Order items must be a non-empty array"),
  body("items.*.laundryItemId")
    .notEmpty()
    .withMessage("Laundry item ID is required")
    .isString()
    .withMessage("Laundry item ID must be a string"),
  body("items.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1")
    .toInt(),
];

// PATCH /api/orders/:id/status - Update order status
export const updateOrderStatusValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "WAITING_FOR_PICKUP",
      "PICKUP_ON_THE_WAY",
      "ARRIVED_AT_OUTLET",
      "WASHING",
      "IRONING",
      "PACKING",
      "WAITING_FOR_PAYMENT",
      "READY_FOR_DELIVERY",
      "DELIVERY_ON_THE_WAY",
      "RECEIVED_BY_CUSTOMER",
      "COMPLETED",
    ])
    .withMessage("Invalid order status"),
  body("workerId")
    .optional()
    .isString()
    .withMessage("Worker ID must be a string"),
  body("note").optional().isString().withMessage("Note must be a string"),
];

// POST /api/orders/:id/bypass-request - Create bypass request
export const createBypassRequestValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
  body("station")
    .notEmpty()
    .withMessage("Station is required")
    .isIn(["WASHING", "IRONING", "PACKING"])
    .withMessage("Invalid station type"),
  body("reason")
    .notEmpty()
    .withMessage("Reason is required")
    .isString()
    .withMessage("Reason must be a string")
    .isLength({ min: 10 })
    .withMessage("Reason must be at least 10 characters"),
  body("itemChecks")
    .notEmpty()
    .withMessage("Item checks are required")
    .isArray({ min: 1 })
    .withMessage("Item checks must be a non-empty array"),
  body("itemChecks.*.laundryItemId")
    .notEmpty()
    .withMessage("Laundry item ID is required")
    .isString()
    .withMessage("Laundry item ID must be a string"),
  body("itemChecks.*.inputQuantity")
    .notEmpty()
    .withMessage("Input quantity is required")
    .isInt({ min: 0 })
    .withMessage("Input quantity must be at least 0"),
];

// PATCH /api/orders/bypass-requests/:id - Handle bypass request
export const handleBypassRequestValidator = [
  param("id")
    .notEmpty()
    .withMessage("Bypass request ID is required")
    .isString()
    .withMessage("Bypass request ID must be a string"),
  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["APPROVED", "REJECTED"])
    .withMessage("Action must be either APPROVED or REJECTED"),
  body("adminNote")
    .optional()
    .isString()
    .withMessage("Admin note must be a string")
    .isLength({ min: 5 })
    .withMessage("Admin note must be at least 5 characters if provided"),
];

// POST /api/customer/orders
export const createOrderByCustomerValidator = [
  body("addressId")
    .notEmpty()
    .withMessage("Address ID is required")
    .isString()
    .withMessage("Address ID must be a string"),
  body("pickupAt")
    .optional()
    // .isISO8601().withMessage("Pickup time must be a valid ISO 8601 date")
    .custom((value) => {
      if (!value) return true;
      const pickupDate = new Date(value);
      const now = new Date();
      if (pickupDate <= now) {
        throw new Error("Pickup time must be in the future");
      }
      return true;
    }),
];

// POST /api/customer/orders/:id/input-details - Admin input order weight & items
export const inputOrderDetailsValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
  body("totalWeight")
    .notEmpty()
    .withMessage("Total weight is required")
    .isFloat({ min: 0.1 })
    .withMessage("Total weight must be at least 0.1 kg")
    .toFloat(),
  body("items")
    .notEmpty()
    .withMessage("Order items are required")
    .isArray({ min: 1 })
    .withMessage("Order items must be a non-empty array"),
  body("items.*.laundryItemId")
    .notEmpty()
    .withMessage("Laundry item ID is required for each item")
    .isString()
    .withMessage("Laundry item ID must be a string"),
  body("items.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required for each item")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1")
    .toInt(),
];

// PATCH /api/customer/orders/:id/driver-status
export const updateDriverStatusValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "PICKUP_ON_THE_WAY",
      "ARRIVED_AT_OUTLET",
      "DELIVERY_ON_THE_WAY",
      "RECEIVED_BY_CUSTOMER",
    ])
    .withMessage(
      "Status must be one of: PICKUP_ON_THE_WAY, ARRIVED_AT_OUTLET, DELIVERY_ON_THE_WAY, RECEIVED_BY_CUSTOMER",
    ),
  body("driverId")
    .notEmpty()
    .withMessage("Driver ID is required")
    .isString()
    .withMessage("Driver ID must be a string"),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .isLength({ max: 500 })
    .withMessage("Note must not exceed 500 characters"),
];

// GET /api/orders/bypass-requests/pending - Get pending bypass requests
export const getPendingBypassRequestsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("outletId")
    .optional()
    .isString()
    .withMessage("Outlet ID must be a string"),
];

export const confirmDeliveryValidator = [
  param("id")
    .notEmpty()
    .withMessage("Order ID is required")
    .isString()
    .withMessage("Order ID must be a string"),
];
