import { useState, useCallback } from 'react';
import type { ApiError } from '../types/error.types';

/**
 * Custom hook for managing notification state (success messages and errors)
 * Provides a clean API for setting success, error, or clearing both
 * @returns Notification state and control functions
 */
export function useNotification() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const clearNotification = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  const setSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setError(null);
  }, []);

  const setErrorMessage = useCallback((errorObj: ApiError) => {
    setError(errorObj);
    setSuccessMessage(null);
  }, []);

  return {
    successMessage,
    error,
    clearNotification,
    setSuccess,
    setError: setErrorMessage
  };
}
