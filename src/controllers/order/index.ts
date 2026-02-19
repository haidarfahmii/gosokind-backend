import { orderController } from "./order.controller";
import { orderStatusController } from "./order-status.controller";
import { bypassController } from "./bypass.controller";
export { orderController, orderStatusController, bypassController };

export const combinedOrderController = {
  // Basic CRUD
  getAllOrders: orderController.getAllOrders,
  getOrderById: orderController.getOrderById,
  createOrderByCustomer: orderController.createOrderByCustomer,
  inputOrderDetails: orderController.inputOrderDetails,

  // Status operations
  updateOrderStatus: orderStatusController.updateOrderStatus,
  updateDriverStatus: orderStatusController.updateDriverStatus,
  confirmDelivery: orderStatusController.confirmDelivery,

  // Bypass operations
  createBypassRequest: bypassController.createBypassRequest,
  handleBypassRequest: bypassController.handleBypassRequest,
  getPendingBypassRequests: bypassController.getPendingBypassRequests,
};
