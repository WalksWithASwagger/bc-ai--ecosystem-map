'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-96 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-terminal-red/30">
          <div className="text-center p-6">
            <AlertTriangle className="w-8 h-8 text-terminal-red mx-auto mb-3" />
            <div className="text-terminal-red font-mono text-sm mb-2">
              MODULE_ERROR: Component failed to load
            </div>
            <div className="text-terminal-muted font-mono text-xs">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-terminal-red/20 border border-terminal-red/30 text-terminal-red rounded font-mono text-xs hover:bg-terminal-red/30 transition-colors"
            >
              RETRY_MODULE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}