import { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children?: ReactNode },
  { error: Error | null }
> {
  public state: { error: Error | null } = {
    error: null,
  };
  public static getDerivedStateFromError(error: Error) {
    return { error };
  }
  public render() {
    return this.state.error ? (
      <div>{this.state.error.message}</div>
    ) : (
      this.props.children
    );
  }
}
