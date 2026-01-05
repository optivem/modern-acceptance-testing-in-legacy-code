import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/order-service';
import type { ViewOrderDetailsResponse } from '../types/api.types';

export function useOrderDetails(orderNumber: string | undefined) {
  const [order, setOrder] = useState<ViewOrderDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadOrderDetails = useCallback(async () => {
    if (!orderNumber) {
      setError('No order number provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await orderService.getOrder(orderNumber);

    if (result.success) {
      setOrder(result.data);
      setError(null);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, [orderNumber]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const cancelOrder = async () => {
    if (!orderNumber) return { success: false, error: 'No order number' };

    setIsCancelling(true);
    const result = await orderService.cancelOrder(orderNumber);
    setIsCancelling(false);

    if (result.success) {
      // Reload order details to get updated status
      await loadOrderDetails();
    }

    return result;
  };

  return {
    order,
    isLoading,
    error,
    isCancelling,
    cancelOrder,
    refresh: loadOrderDetails
  };
}
