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
}

// API Response types
export interface PlaceOrderResponse {
  orderNumber: string;
}

export interface GetOrderResponse {
  orderNumber: string;
  sku: string;
  country: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountRate: number;
  discountAmount: number;
  subtotalPrice: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
  status: OrderStatus;
}

