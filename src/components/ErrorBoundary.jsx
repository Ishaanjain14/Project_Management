import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950 px-4">
                    <div className="p-8 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-xl shadow-lg max-w-md w-full text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
                        <p className="text-red-500 dark:text-red-400 text-sm mb-4 font-mono text-left break-words">
                            {this.state.error?.toString()}
                        </p>
                        <details className="text-left mb-6">
                            <summary className="text-xs text-gray-500 cursor-pointer">View Stack Trace</summary>
                            <pre className="text-xs text-gray-500 mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                                {this.state.error?.stack}
                            </pre>
                        </details>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-2 px-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition"
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
