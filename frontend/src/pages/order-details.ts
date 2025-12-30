// UI Controller for Order Details page

import { handleResult, showSuccessNotification } from '../common';
import { orderService } from '../services/order-service';
import type { ViewOrderDetailsResponse } from '../types/api.types';

// Get order number from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const orderNumber = urlParams.get('orderNumber');

if (!orderNumber) {
  const container = document.getElementById('orderDetailsContainer')!;
  container.setAttribute('aria-busy', 'false');
  container.innerHTML = 
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
    const container = document.getElementById('orderDetailsContainer')!;
    container.setAttribute('aria-busy', 'false');
    container.innerHTML = 
      '<p style="color: red;">Failed to load order details</p>';
  }
}

function displayOrderDetails(order: ViewOrderDetailsResponse) {
  const container = document.getElementById('orderDetailsContainer');
  if (!container) return;

  container.setAttribute('aria-busy', 'false');

  const html = `
    <div class="details-grid">
      <label>Order Number:</label>
      <div class="value" aria-label="Display Order Number">${order.orderNumber}</div>
      
      <label>Order Timestamp:</label>
      <div class="value" aria-label="Display Order Timestamp">${new Date(order.orderTimestamp).toLocaleString()}</div>
      
      <label>Status:</label>
      <div class="value status-${order.status}" aria-label="Display Status">${order.status}</div>
      
      <label>SKU:</label>
      <div class="value" aria-label="Display SKU">${order.sku}</div>
      
      <label>Country:</label>
      <div class="value" aria-label="Display Country">${order.country}</div>
      
      <label>Quantity:</label>
      <div class="value" aria-label="Display Quantity">${order.quantity}</div>
      
      <label>Unit Price:</label>
      <div class="value" aria-label="Display Unit Price">$${order.unitPrice.toFixed(2)}</div>
      
      <label>Base Price:</label>
      <div class="value" aria-label="Display Base Price">$${order.basePrice.toFixed(2)}</div>
      
      <label>Discount Rate:</label>
      <div class="value" aria-label="Display Discount Rate">${(order.discountRate * 100).toFixed(2)}%</div>
      
      <label>Discount Amount:</label>
      <div class="value" aria-label="Display Discount Amount">$${order.discountAmount.toFixed(2)}</div>
      
      <label>Subtotal Price:</label>
      <div class="value" aria-label="Display Subtotal Price">$${order.subtotalPrice.toFixed(2)}</div>
      
      <label>Tax Rate:</label>
      <div class="value" aria-label="Display Tax Rate">${(order.taxRate * 100).toFixed(2)}%</div>
      
      <label>Tax Amount:</label>
      <div class="value" aria-label="Display Tax Amount">$${order.taxAmount.toFixed(2)}</div>
      
      <label>Total Price:</label>
      <div class="value" aria-label="Display Total Price"><strong>$${order.totalPrice.toFixed(2)}</strong></div>
      
      <label>Applied Coupon:</label>
      <div class="value" aria-label="Display Applied Coupon">${order.appliedCouponCode || 'None'}</div>
    </div>
    
    <div class="actions">
      ${order.status === 'PLACED' ? '<button id="cancelButton" aria-label="Cancel Order">Cancel Order</button>' : ''}
      <button id="backButton" aria-label="Back to Order History">Back to Order History</button>
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
