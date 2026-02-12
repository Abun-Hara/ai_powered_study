import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled UI error', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="full-center">
          <div className="card max-520 stack">
            <h2>Something went wrong</h2>
            <p className="muted">Please refresh this page. If the issue continues, contact support.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

