import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'page' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const { error, errorInfo } = this.state;

      // Different UI based on error boundary level
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-destructive/10 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <CardTitle className="text-2xl">Application Error</CardTitle>
                </div>
                <CardDescription>
                  We're sorry, but something went wrong. Our team has been notified.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {process.env.NODE_ENV === 'development' && error && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-mono text-destructive mb-2">
                      {error.toString()}
                    </p>
                    {errorInfo && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs overflow-auto max-h-60 text-muted-foreground">
                          {errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={this.handleReload} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (level === 'page') {
        return (
          <div className="container mx-auto py-8 px-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle>Page Error</CardTitle>
                </div>
                <CardDescription>
                  This page encountered an error. Try refreshing or go back home.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {process.env.NODE_ENV === 'development' && error && (
                  <div className="bg-muted p-3 rounded text-sm font-mono text-destructive">
                    {error.toString()}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={this.handleReset} size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline" size="sm" className="gap-2">
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component level - minimal UI
      return (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-destructive">
                Component Error
              </p>
              <p className="text-sm text-muted-foreground">
                This component failed to load.
              </p>
              {process.env.NODE_ENV === 'development' && error && (
                <p className="text-xs font-mono text-destructive mt-2">
                  {error.toString()}
                </p>
              )}
              <Button onClick={this.handleReset} size="sm" variant="outline" className="mt-2">
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
