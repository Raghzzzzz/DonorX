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
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#FEF2F2'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😕</div>
                    <h1 style={{ color: '#991B1B', marginBottom: '0.5rem' }}>Something went wrong.</h1>
                    <p style={{ color: '#7F1D1D', maxWidth: '500px', marginBottom: '2rem' }}>
                        The application encountered an unexpected error.
                        {this.state.error && <code style={{ display: 'block', margin: '1rem 0', padding: '1rem', background: '#FEE2E2', borderRadius: '8px' }}>{this.state.error.toString()}</code>}
                    </p>
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#DC2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        Reset App & Clear Data
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            color: '#991B1B',
                            border: '1px solid #991B1B',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
