import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  customMessage?: string;
}

/**
 * Custom hook for handling errors consistently across the application
 */
export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);
  const [isError, setIsError] = useState(false);

  const handleError = useCallback(
    (error: Error | unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        logToConsole = true,
        customMessage,
      } = options;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setError(errorObj);
      setIsError(true);

      if (logToConsole) {
        console.error('Error handled:', errorObj);
      }

      if (showToast) {
        toast.error(customMessage || errorObj.message || 'An error occurred');
      }

      // Log to external service in production
      if (process.env.NODE_ENV === 'production') {
        // Example: logErrorToService(errorObj);
      }

      return errorObj;
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  const resetError = clearError; // Alias for consistency

  return {
    error,
    isError,
    handleError,
    clearError,
    resetError,
  };
};

/**
 * Async error handler wrapper
 */
export const withErrorHandler = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: ErrorHandlerOptions
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      if (options?.logToConsole) {
        console.error('Error in async operation:', errorObj);
      }
      
      if (options?.showToast) {
        toast.error(options?.customMessage || errorObj.message || 'An error occurred');
      }
      
      throw errorObj;
    }
  }) as T;
};
