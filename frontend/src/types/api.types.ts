// API Request and Response types for Order operations

export enum OrderStatus {
  PLACED = 'PLACED',
  CANCELLED = 'CANCELLED'
}

// API Request types
export interface PlaceOrderRequest {
  sku: string;
  quantity: number;
  country: string;
  couponCode?: string;
}

// API Response types
export interface PlaceOrderResponse {
  orderNumber: string;
}

export interface GetOrderResponse {
  orderNumber: string;
  orderTimestamp: string; // ISO 8601 date string
  sku: string;
  country: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  discountRate: number;
  discountAmount: number;
  subtotalPrice: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
  status: OrderStatus;
  appliedCouponCode?: string;
}

// Browse Order History types
export interface BrowseOrderHistoryItemResponse {
  orderNumber: string;
  orderTimestamp: string; // ISO 8601 date string
  sku: string;
  country: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  appliedCouponCode?: string;
}

export interface BrowseOrderHistoryResponse {
  orders: BrowseOrderHistoryItemResponse[];
}

// Coupon API types
export interface PublishCouponRequest {
  code: string;
  discountRate: number;
  validFrom?: string; // ISO 8601 date string - optional (valid from now if not provided)
  validTo?: string;   // ISO 8601 date string - optional (never expires if not provided)
  usageLimit?: number; // Optional - if not provided, no limit
}

export interface CreateCouponResponse {
  code: string;
}

export interface GetCouponResponse {
  code: string;
  discountRate: number;
  validFrom?: string; // ISO 8601 date string
  validTo?: string;   // ISO 8601 date string
  usageLimit: number;
  usedCount: number;
}

