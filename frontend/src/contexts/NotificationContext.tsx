import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ApiError } from '../types/error.types';
import type { Result } from '../types/result.types';
import { match } from '../types/result.types';

interface NotificationContextType {
  successMessage: string | null;
  error: ApiError | null;
  clearNotification: () => void;
  setSuccess: (message: string) => void;
  setError: (error: ApiError) => void;
  handleResult: <T>(result: Result<T>, onSuccess: (data: T) => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
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

  const handleResult = useCallback(<T,>(
    result: Result<T>,
    onSuccess: (data: T) => void
  ) => {
    clearNotification();
    match(result, {
      success: onSuccess,
      error: (error) => setError(error)
    });
  }, [clearNotification]);

  return (
    <NotificationContext.Provider value={{
      successMessage,
      error,
      clearNotification,
      setSuccess,
      setError: setErrorMessage,
      handleResult
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
