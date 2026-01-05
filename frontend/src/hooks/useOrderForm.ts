import { useState } from 'react';
import { orderService } from '../services/order-service';
import type { OrderFormData } from '../types/form.types';
import type { PlaceOrderResponse } from '../types/api.types';
import type { Result } from '../types/result.types';

interface ValidationError {
  field: string;
  message: string;
}

export function useOrderForm() {
  const [formData, setFormData] = useState<OrderFormData>({
    sku: '',
    quantity: 0,
    country: 'US',
    quantityValue: '',
    couponCode: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PlaceOrderResponse | null>(null);

  const validateFormData = (data: OrderFormData): ValidationError[] => {
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

    return errors;
  };

  const submitOrder = async (): Promise<Result<PlaceOrderResponse>> => {
    setError(null);
    setSuccess(null);

    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      const errorMessage = 'The request contains one or more validation errors\n' +
        validationErrors.map(e => `${e.field}: ${e.message}`).join('\n');
      setError(errorMessage);
      return {
        success: false,
        error: {
          message: 'The request contains one or more validation errors',
          fieldErrors: validationErrors.map(e => `${e.field}: ${e.message}`)
        }
      };
    }

    setIsSubmitting(true);
    const result = await orderService.placeOrder(
      formData.sku,
      formData.quantity,
      formData.country,
      formData.couponCode
    );
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(result.data);
      // Reset form on success
      setFormData({
        sku: '',
        quantity: 0,
        country: 'US',
        quantityValue: '',
        couponCode: undefined
      });
    } else {
      const errorMessage = result.error.message +
        (result.error.fieldErrors ? '\n' + result.error.fieldErrors.join('\n') : '');
      setError(errorMessage);
    }

    return result;
  };

  const updateFormData = (updates: Partial<OrderFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      quantity: 0,
      country: 'US',
      quantityValue: '',
      couponCode: undefined
    });
    setError(null);
    setSuccess(null);
  };

  return {
    formData,
    updateFormData,
    isSubmitting,
    error,
    success,
    submitOrder,
    resetForm
  };
}
