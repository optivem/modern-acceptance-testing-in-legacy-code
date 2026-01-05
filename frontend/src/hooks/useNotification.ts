import { useState, useCallback } from 'react';
import type { ApiError } from '../types/error.types';
import type { Result } from '../types/result.types';
import { match } from '../types/result.types';

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

  /**
   * Handles a Result by clearing notifications and auto-handling errors
   * Only requires success handler - error case automatically calls setError
   * 
   * @param result - The Result to handle
   * @param onSuccess - Handler called on success (error handled automatically)
   * 
   * @example
   * handleResult(await submitCoupon(formData), () => {
   *   setSuccess('Created!');
   *   resetForm();
   * });
   */
  const handleResult = useCallback(<T>(
    result: Result<T>,
    onSuccess: (data: T) => void
  ) => {
    clearNotification();
    match(result, {
      success: onSuccess,
      error: (error) => setError(error)
    });
  }, [clearNotification, setError]);

  return {
    successMessage,
    error,
    clearNotification,
    setSuccess,
    setError: setErrorMessage,
    handleResult
  };
}
