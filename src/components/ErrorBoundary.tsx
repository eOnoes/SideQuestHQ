"use client";

import { Component, type ReactNode } from "react";

type Props = {
  name: string;
  children: ReactNode;
  onRetry?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name}]`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-card">
            <span className="error-boundary-icon">⚠</span>
            <span className="error-boundary-module">{this.props.name}</span>
            <span className="error-boundary-msg">
              {this.state.error?.message || "Something went wrong"}
            </span>
            <button
              className="error-boundary-retry"
              onClick={this.handleRetry}
              type="button"
            >
              ↻ retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
