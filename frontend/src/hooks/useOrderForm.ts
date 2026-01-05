import { useState, useCallback } from 'react';
import { orderService } from '../services/order-service';
import type { OrderFormData } from '../types/form.types';
import type { PlaceOrderResponse } from '../types/api.types';
import type { Result } from '../types/result.types';
import type { ApiError } from '../types/error.types';

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Custom hook for managing order form state, validation, and submission
 * Handles all business logic for placing orders including client-side validation
 * @returns Form state, submission state, and control functions
 */
export function useOrderForm() {
  const [formData, setFormData] = useState<OrderFormData>({
    sku: '',
    quantity: 0,
    country: 'US',
    quantityValue: '',
    couponCode: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
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

  const clearNotification = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const submitOrder = async (): Promise<Result<PlaceOrderResponse>> => {
    // Clear any previous notifications
    clearNotification();

    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      const apiError = {
        message: 'The request contains one or more validation errors',
        fieldErrors: validationErrors.map(e => `${e.field}: ${e.message}`)
      };
      setError(apiError);
      return {
        success: false,
        error: apiError
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
      setError(result.error);
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
    clearNotification();
  };

  return {
    formData,
    updateFormData,
    isSubmitting,
    error,
    success,
    submitOrder,
    resetForm,
    clearNotification
  };
}
