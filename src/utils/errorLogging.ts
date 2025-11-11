/**
 * Error logging utilities for tracking and reporting errors
 */

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  componentStack?: string;
  metadata?: Record<string, any>;
}

/**
 * Log error to console with formatted output
 */
export const logError = (error: Error, metadata?: Record<string, any>) => {
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    metadata,
  };

  console.error('Error logged:', errorLog);
  
  return errorLog;
};

/**
 * Send error to external logging service
 * Replace with your preferred error tracking service (e.g., Sentry, LogRocket, etc.)
 */
export const sendErrorToService = async (
  error: Error,
  errorInfo?: React.ErrorInfo,
  metadata?: Record<string, any>
) => {
  // Only send in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentStack: errorInfo?.componentStack,
      metadata,
    };

    // Example: Send to your error tracking service
    // await fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog),
    // });

    console.log('Error would be sent to logging service:', errorLog);
  } catch (loggingError) {
    console.error('Failed to log error to service:', loggingError);
  }
};

/**
 * Create a standardized error object
 */
export const createError = (
  message: string,
  code?: string,
  metadata?: Record<string, any>
): Error & { code?: string; metadata?: Record<string, any> } => {
  const error = new Error(message) as Error & {
    code?: string;
    metadata?: Record<string, any>;
  };
  
  if (code) {
    error.code = code;
  }
  
  if (metadata) {
    error.metadata = metadata;
  }
  
  return error;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: Error): boolean => {
  return (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch') ||
    error.name === 'NetworkError'
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: Error): boolean => {
  return (
    error.message.includes('unauthorized') ||
    error.message.includes('authentication') ||
    error.message.includes('401') ||
    error.message.includes('403')
  );
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: Error): string => {
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  if (isAuthError(error)) {
    return 'Authentication error. Please log in again.';
  }
  
  // Return original message or generic message
  return error.message || 'An unexpected error occurred. Please try again.';
};
