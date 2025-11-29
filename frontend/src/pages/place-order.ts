// UI Controller for Place Order page

import { showNotification, handleResult, showSuccessNotification } from '../common';
import { orderService } from '../services/order-service';
import type { OrderFormData } from '../types/form.types';

console.log('[Place Order] Script loaded and executing');

const formElement = document.getElementById('orderForm');
console.log('[Place Order] Form element found:', formElement);

formElement?.addEventListener('submit', async function(e: Event) {
  console.log('[Place Order] Form submit event triggered');
  e.preventDefault();
  console.log('[Place Order] Default form submission prevented');

  const orderData = collectFormData();
  console.log('[Place Order] Form data collected:', orderData);

  if (!validateFormData(orderData)) {
    console.log('[Place Order] Validation failed');
    return;
  }

  console.log('[Place Order] Validation passed, calling API...');
  const result = await orderService.placeOrder(orderData.sku, orderData.quantity, orderData.country);
  console.log('[Place Order] API response received:', result);

  handleResult(result, (order) => {
    console.log('[Place Order] Order placed successfully:', order);
    showSuccessNotification('Success! Order has been created with Order Number ' + order.orderNumber);
  });
});

function collectFormData(): OrderFormData {
  const skuElement = document.getElementById('sku') as HTMLInputElement;
  const quantityElement = document.getElementById('quantity') as HTMLInputElement;
  const countryElement = document.getElementById('country') as HTMLInputElement;

  const skuValue = skuElement?.value ?? '';
  const quantityValue = quantityElement?.value ?? '';
  const countryValue = countryElement?.value ?? '';

  return {
    sku: skuValue.trim(),
    quantity: parseInt(quantityValue),
    country: countryValue.trim(),
    quantityValue: quantityValue
  };
}

function validateFormData(data: OrderFormData): boolean {
  const notificationsDiv = document.getElementById('notifications');
  if (notificationsDiv) {
    notificationsDiv.innerHTML = '';
  }

  const quantityTrimmed = data.quantityValue.trim();

  if (!data.sku) {
    showNotification('SKU must not be empty', true);
    return false;
  }

  if (quantityTrimmed === '') {
    showNotification('Quantity must not be empty', true);
    return false;
  }

  const quantityNum = parseFloat(quantityTrimmed);

  if (isNaN(quantityNum)) {
    showNotification('Quantity must be an integer', true);
    return false;
  }

  if (!Number.isInteger(quantityNum)) {
    showNotification('Quantity must be an integer', true);
    return false;
  }

  if (quantityNum <= 0) {
    showNotification('Quantity must be positive', true);
    return false;
  }

  if (!data.country) {
    showNotification('Country must not be empty', true);
    return false;
  }

  return true;
}

