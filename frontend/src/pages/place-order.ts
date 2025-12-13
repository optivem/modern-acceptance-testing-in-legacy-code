// UI Controller for Place Order page

import { showApiError, handleResult, showSuccessNotification } from '../common';
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

interface ValidationError {
  field: string;
  message: string;
}

function validateFormData(data: OrderFormData): boolean {
  const notificationsDiv = document.getElementById('notifications');
  if (notificationsDiv) {
    notificationsDiv.innerHTML = '';
  }

  const errors: ValidationError[] = [];
  const quantityTrimmed = data.quantityValue.trim();

  if (!data.sku) {
    errors.push({ field: 'sku', message: 'SKU must not be empty' });
  }

  if (quantityTrimmed === '') {
    errors.push({ field: 'quantity', message: 'Quantity must not be empty' });
  } else {
    const quantityNum = parseFloat(quantityTrimmed);

    if (isNaN(quantityNum)) {
      errors.push({ field: 'quantity', message: 'Quantity must be an integer' });
    } else if (!Number.isInteger(quantityNum)) {
      errors.push({ field: 'quantity', message: 'Quantity must be an integer' });
    } else if (quantityNum <= 0) {
      errors.push({ field: 'quantity', message: 'Quantity must be positive' });
    }
  }

  if (!data.country) {
    errors.push({ field: 'country', message: 'Country must not be empty' });
  }

  if (errors.length > 0) {
    // Format as ApiError with field errors
    showApiError({
      message: 'The request contains one or more validation errors',
      fieldErrors: errors.map(e => `${e.field}: ${e.message}`)
    });
    return false;
  }

  return true;
}