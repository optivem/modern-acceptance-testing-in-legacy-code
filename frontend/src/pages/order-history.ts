// UI Controller for Order History page

import { handleResult } from '../common';
import { orderService } from '../services/order-service';
import type { BrowseOrderHistoryItemResponse } from '../types/api.types';

// Load orders with optional filter
async function loadOrders() {
  const filterInput = document.getElementById('orderNumberFilter') as HTMLInputElement;
  const filterValue = filterInput?.value || '';
  
  const result = await orderService.browseOrderHistory(filterValue);
  handleResult(result, (response) => {
    displayOrders(response.orders);
  });
  
  if (!result.success) {
    const tbody = document.getElementById('orderTableBody');
    if (tbody) {
      tbody.setAttribute('aria-busy', 'false');
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Failed to load orders</td></tr>';
    }
  }
}

function displayOrders(orders: BrowseOrderHistoryItemResponse[]) {
  const tbody = document.getElementById('orderTableBody');
  if (!tbody) return;

  tbody.setAttribute('aria-busy', 'false');

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const timestamp = new Date(order.orderTimestamp).toLocaleString();
    
    return `
      <tr>
        <td aria-label="Display Order Number">${order.orderNumber}</td>
        <td aria-label="Display Timestamp">${timestamp}</td>
        <td aria-label="Display SKU">${order.sku}</td>
        <td aria-label="Display Country">${order.country}</td>
        <td aria-label="Display Quantity">${order.quantity}</td>
        <td aria-label="Display Total Price">$${order.totalPrice.toFixed(2)}</td>
        <td class="status-${order.status}" aria-label="Display Status">${order.status}</td>
        <td aria-label="Display Coupon">${order.appliedCouponCode || 'None'}</td>
        <td><a href="/order-details.html?orderNumber=${encodeURIComponent(order.orderNumber)}" aria-label="View Details">View Details</a></td>
      </tr>
    `;
  }).join('');
}

// Set up event listeners
document.getElementById('orderNumberFilter')?.addEventListener('input', loadOrders);
document.getElementById('refreshButton')?.addEventListener('click', loadOrders);

// Reload orders when page becomes visible (handles browser back button)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadOrders();
  }
});

// Load orders on page load
loadOrders();

