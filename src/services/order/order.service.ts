import { orderQueryService } from "./order-query.service";
import { orderCreationService } from "./order-creation.service";
import { orderStatusService } from "./order-status.service";
import { bypassService } from "./bypass.service";

export const orderService = {
  // QUERY OPERATIONS

  // Get all orders with filters and pagination
  getAllOrders: orderQueryService.getAllOrders,
  // Get order by ID with full details
  getOrderById: orderQueryService.getOrderById,
  getOrderbyOrderNumber: orderQueryService.getOrderByOrderNumber,

  // CREATION OPERATIONS

  // Create order by customer (pickup request)
  createOrderByCustomer: orderCreationService.createOrderByCustomer,
  // Input order details (weight & items) after arrival at outlet
  inputOrderDetails: orderCreationService.inputOrderDetails,

  //  STATUS OPERATIONS

  // Update order status (for admin and workers)
  updateOrderStatus: orderStatusService.updateOrderStatus,
  // Update driver status (for driver operations)
  updateDriverStatus: orderStatusService.updateDriverStatus,
  // Confirm delivery (customer confirms receipt)
  confirmDelivery: orderStatusService.confirmDelivery,

  //  BYPASS OPERATIONS

  // Create bypass request (when item count doesn't match)
  createBypassRequest: bypassService.createBypassRequest,
  // Handle bypass request (approve/reject)
  handleBypassRequest: bypassService.handleBypassRequest,
  // Get pending bypass requests
  getPendingBypassRequests: bypassService.getPendingBypassRequests,
};

export {
  orderQueryService,
  orderCreationService,
  orderStatusService,
  bypassService,
};
