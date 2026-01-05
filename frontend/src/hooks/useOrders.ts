import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/order-service';
import type { BrowseOrderHistoryItemResponse } from '../types/api.types';

export function useOrders(initialFilter: string = '') {
  const [orders, setOrders] = useState<BrowseOrderHistoryItemResponse[]>([]);
  const [filter, setFilter] = useState(initialFilter);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (filterValue: string = filter) => {
    setIsLoading(true);
    setError(null);

    const result = await orderService.browseOrderHistory(filterValue);

    if (result.success) {
      setOrders(result.data.orders);
    } else {
      setError(result.error.message);
    }
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    loadOrders(filter);
  }, [filter, loadOrders]);

  const refresh = () => {
    loadOrders(filter);
  };

  return {
    orders,
    filter,
    setFilter,
    isLoading,
    error,
    refresh
  };
}
