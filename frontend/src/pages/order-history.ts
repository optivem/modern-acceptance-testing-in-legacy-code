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
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Failed to load orders</td></tr>';
    }
  }
}

function displayOrders(orders: BrowseOrderHistoryItemResponse[]) {
  const tbody = document.getElementById('orderTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const timestamp = new Date(order.orderTimestamp).toLocaleString();
    
    return `
      <tr>
        <td>${order.orderNumber}</td>
        <td>${timestamp}</td>
        <td>${order.sku}</td>
        <td>${order.country}</td>
        <td>${order.quantity}</td>
        <td>$${order.totalPrice.toFixed(2)}</td>
        <td class="status-${order.status}">${order.status}</td>
        <td>${order.appliedCouponCode || 'None'}</td>
        <td><a href="/order-details.html?orderNumber=${encodeURIComponent(order.orderNumber)}">View Details</a></td>
      </tr>
    `;
  }).join('');
}

// Set up event listeners
document.getElementById('orderNumberFilter')?.addEventListener('input', loadOrders);
document.getElementById('refreshButton')?.addEventListener('click', loadOrders);

// Load orders on page load
loadOrders();

