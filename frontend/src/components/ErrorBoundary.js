import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen px-4" style={{ backgroundColor: 'rgb(var(--bg))', color: 'rgb(var(--text))' }}>
                    <div className="text-center max-w-md space-y-4">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold">Something went wrong</h1>
                        <p style={{ color: 'rgb(var(--muted))' }}>
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: 'rgb(var(--brand))' }}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
