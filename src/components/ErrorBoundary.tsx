import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-5">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-extrabold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">{this.state.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: "" }); window.location.href = "/"; }}
            className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm"
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
