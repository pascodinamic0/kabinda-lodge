import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import AsyncErrorBoundary from './AsyncErrorBoundary';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Button } from './ui/button';

/**
 * Example component demonstrating various error boundary usage patterns
 * This file can be removed or used as a reference
 */

// Example 1: Component-level error boundary
const RiskyComponent: React.FC = () => {
  return (
    <ErrorBoundary level="component">
      <div>
        <h3>This component is protected by an error boundary</h3>
        {/* Component content */}
      </div>
    </ErrorBoundary>
  );
};

// Example 2: Async component with error boundary
const AsyncDataComponent: React.FC = () => {
  return (
    <AsyncErrorBoundary level="component">
      <div>
        <h3>This async component has error protection</h3>
        {/* Component that fetches data */}
      </div>
    </AsyncErrorBoundary>
  );
};

// Example 3: Using the error handler hook
const ComponentWithErrorHandler: React.FC = () => {
  const { error, isError, handleError, clearError } = useErrorHandler();

  const handleAction = async () => {
    try {
      // Some risky operation
      throw new Error('Something went wrong!');
    } catch (err) {
      handleError(err, {
        showToast: true,
        customMessage: 'Failed to perform action',
      });
    }
  };

  if (isError && error) {
    return (
      <div className="p-4 bg-destructive/10 rounded-lg">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button onClick={clearError} size="sm" className="mt-2">
          Clear Error
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={handleAction}>Trigger Error</Button>
    </div>
  );
};

// Example 4: Custom fallback UI
const ComponentWithCustomFallback: React.FC = () => {
  return (
    <ErrorBoundary
      level="component"
      fallback={
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800">Custom error message here</p>
        </div>
      }
    >
      <div>Protected content</div>
    </ErrorBoundary>
  );
};

const ErrorBoundaryExample: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Error Boundary Examples</h2>
      <RiskyComponent />
      <AsyncDataComponent />
      <ComponentWithErrorHandler />
      <ComponentWithCustomFallback />
    </div>
  );
};

export default ErrorBoundaryExample;
