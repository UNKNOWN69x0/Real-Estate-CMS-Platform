import { Component } from 'react';

// Keeps one broken page from leaving a blank screen
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Admin render error:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="grid min-h-svh place-items-center bg-sand p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-brown-700">Something went wrong</p>
          <p className="mt-1 text-sm text-brown-600">This page hit an unexpected error.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 bg-brown-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-brown-800"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
