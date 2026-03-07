import { OrderStatus, StationType, BypassStatus } from "@prisma/client";

export interface CreateOrderInput {
  customerId: string;
  addressId: string;
  totalWeight: number;
  items: OrderItemInput[];
}

export interface OrderItemInput {
  laundryItemId: string;
  quantity: number;
}

// input untuk cus membuat order baru
export interface CreateOrderByCustomerInput {
  addressId: string;
  pickupAt?: string | Date;
}

// input untuk admin mengisi detail order
export interface InputOrderDetails {
  totalWeight: number;
  items: OrderItemInput[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  workerId?: string; // Required untuk status WASHING, IRONING, PACKING
  note?: string;
}

// input untuk driver update status order
export interface UpdateDriverStatusInput {
  status: OrderStatus;
  driverId: string;
  note?: string;
}

export interface CreateBypassRequestInput {
  orderId: string;
  station: StationType;
  reason: string;
  itemChecks: StationItemCheckInput[];
}

export interface StationItemCheckInput {
  laundryItemId: string;
  inputQuantity: number;
}

export interface HandleBypassRequestInput {
  action: "APPROVED" | "REJECTED";
  adminNote?: string;
}

export interface GetAllOrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  outletId?: string; // Filter by outlet (for super admin)
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  totalWeight: number | null;
  totalPrice: number | null;
  isPaid: boolean;
  status: OrderStatus;
  pickupAt: string | Date;

  // Customer info
  customer: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };

  // Address info
  address: {
    id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  };

  // Outlet info
  outlet: {
    id: string;
    name: string;
    address: string;
  } | null;

  // Driver info
  pickupDriver: {
    id: string;
    fullName: string;
  } | null;

  deliveryDriver: {
    id: string;
    fullName: string;
  } | null;

  // Order items
  orderItems: Array<{
    id: string;
    laundryItem: {
      id: string;
      name: string;
      category: string | null;
    };
    quantity: number;
  }>;

  // Station processes (for tracking)
  stationProcesses: Array<{
    id: string;
    station: StationType;
    worker: {
      id: string;
      fullName: string;
    };
    startedAt: Date;
    completedAt: Date | null;
    itemChecks: Array<{
      id: string;
      laundryItem: {
        id: string;
        name: string;
      };
      inputQuantity: number;
    }>;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

export interface BypassRequestResponse {
  id: string;
  order: {
    id: string;
    orderNumber: string;
  };
  worker: {
    id: string;
    fullName: string;
  };
  station: StationType;
  reason: string;
  status: BypassStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderListResponse {
  orders: OrderResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrderStatsResponse {
  totalOrders: number;
  byStatus: Record<OrderStatus, number>;
  totalRevenue: number;
}
