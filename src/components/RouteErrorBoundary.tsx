import React, { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { useLocation } from 'react-router-dom';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Route-level error boundary that resets when the route changes
 */
const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ children }) => {
  const location = useLocation();

  // Reset error boundary when route changes
  return (
    <ErrorBoundary
      key={location.pathname}
      level="page"
      onError={(error, errorInfo) => {
        console.error('Route error:', {
          path: location.pathname,
          error: error.message,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;
