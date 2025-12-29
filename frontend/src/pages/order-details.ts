// UI Controller for Order Details page

import { handleResult, showSuccessNotification } from '../common';
import { orderService } from '../services/order-service';
import type { ViewOrderDetailsResponse } from '../types/api.types';

// Get order number from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const orderNumber = urlParams.get('orderNumber');

if (!orderNumber) {
  document.getElementById('orderDetailsContainer')!.innerHTML = 
    '<p style="color: red;">Error: No order number provided</p>';
} else {
  loadOrderDetails(orderNumber);
}

async function loadOrderDetails(orderNumber: string) {
  const result = await orderService.getOrder(orderNumber);
  handleResult(result, (order) => {
    displayOrderDetails(order);
  });
  
  if (!result.success) {
    document.getElementById('orderDetailsContainer')!.innerHTML = 
      '<p style="color: red;">Failed to load order details</p>';
  }
}

function displayOrderDetails(order: ViewOrderDetailsResponse) {
  const container = document.getElementById('orderDetailsContainer');
  if (!container) return;

  const html = `
    <div class="details-grid">
      <label>Order Number:</label>
      <div class="value">${order.orderNumber}</div>
      
      <label>Order Timestamp:</label>
      <div class="value">${new Date(order.orderTimestamp).toLocaleString()}</div>
      
      <label>Status:</label>
      <div class="value status-${order.status}">${order.status}</div>
      
      <label>SKU:</label>
      <div class="value">${order.sku}</div>
      
      <label>Country:</label>
      <div class="value">${order.country}</div>
      
      <label>Quantity:</label>
      <div class="value">${order.quantity}</div>
      
      <label>Unit Price:</label>
      <div class="value">$${order.unitPrice.toFixed(2)}</div>
      
      <label>Base Price:</label>
      <div class="value">$${order.basePrice.toFixed(2)}</div>
      
      <label>Discount Rate:</label>
      <div class="value">${(order.discountRate * 100).toFixed(2)}%</div>
      
      <label>Discount Amount:</label>
      <div class="value">$${order.discountAmount.toFixed(2)}</div>
      
      <label>Subtotal Price:</label>
      <div class="value">$${order.subtotalPrice.toFixed(2)}</div>
      
      <label>Tax Rate:</label>
      <div class="value">${(order.taxRate * 100).toFixed(2)}%</div>
      
      <label>Tax Amount:</label>
      <div class="value">$${order.taxAmount.toFixed(2)}</div>
      
      <label>Total Price:</label>
      <div class="value"><strong>$${order.totalPrice.toFixed(2)}</strong></div>
      
      <label>Applied Coupon:</label>
      <div class="value">${order.appliedCouponCode || 'None'}</div>
    </div>
    
    <div class="actions">
      ${order.status === 'PLACED' ? '<button id="cancelButton">Cancel Order</button>' : ''}
      <button id="backButton">Back to Order History</button>
    </div>
  `;
  
  container.innerHTML = html;

  // Add event listeners
  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => handleCancelOrder(order.orderNumber));
  }

  document.getElementById('backButton')?.addEventListener('click', () => {
    window.location.href = '/order-history.html';
  });
}

async function handleCancelOrder(orderNumber: string): Promise<void> {
  const result = await orderService.cancelOrder(orderNumber);
  handleResult(result, async () => {
    showSuccessNotification('Order cancelled successfully!');
    // Reload the page to show updated status
    await loadOrderDetails(orderNumber);
  });
}
