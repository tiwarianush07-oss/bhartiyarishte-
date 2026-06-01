import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            {/* Animated icon */}
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping opacity-30"></div>
              <div className="relative w-full h-full bg-rose-50 rounded-full flex items-center justify-center border-4 border-rose-100 shadow-lg">
                <span className="text-5xl">⚠️</span>
              </div>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
              Something went wrong
            </h1>
            <p className="text-gray-500 font-medium mb-2 leading-relaxed">
              An unexpected error occurred. Your data is safe — this is just a display issue.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorMessage && (
              <div className="mb-6 p-4 bg-gray-900 text-rose-400 rounded-2xl text-left text-xs font-mono overflow-auto max-h-32 border border-rose-900/30">
                {this.state.errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <button
                onClick={this.handleReload}
                className="px-8 py-4 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition shadow-lg shadow-rose-200 active:scale-95"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition shadow-lg active:scale-95"
              >
                Go To Homepage
              </button>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8">
              If this keeps happening, contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
