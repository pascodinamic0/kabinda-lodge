import React, { ReactNode, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Loader2 } from 'lucide-react';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  level?: 'app' | 'page' | 'component';
}

/**
 * Error boundary wrapper for async operations with loading states
 * Useful for wrapping components that fetch data on mount
 */
const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  fallback,
  loadingFallback,
  level = 'component',
}) => {
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <>
        {loadingFallback || (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </>
    );
  }

  return (
    <ErrorBoundary level={level} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
};

export default AsyncErrorBoundary;
