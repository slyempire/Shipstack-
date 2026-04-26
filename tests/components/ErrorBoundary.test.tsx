import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that always throws
const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

// Component that renders fine
const SafeChild = () => <div data-testid="safe">All good</div>;

// ─── White-box Tests — internal error parsing logic ──────────────────────────

describe('ErrorBoundary — error catching', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('safe')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test crash" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText('Test crash')).toBeInTheDocument();
  });

  it('shows componentName in error UI', () => {
    render(
      <ErrorBoundary componentName="Analytics Module">
        <ThrowError message="oops" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Analytics Module')).toBeInTheDocument();
  });

  it('falls back to "System Module" when no componentName given', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="broken" />
      </ErrorBoundary>
    );
    expect(screen.getByText('System Module')).toBeInTheDocument();
  });

  it('shows generic message for non-JSON error', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Cannot read property of undefined" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Cannot read property of undefined')).toBeInTheDocument();
  });

  it('parses structured DB error JSON from message', () => {
    const dbError = JSON.stringify({
      error: 'connection refused',
      operationType: 'SELECT',
      path: '/users',
    });
    render(
      <ErrorBoundary>
        <ThrowError message={dbError} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Database Error/)).toBeInTheDocument();
    expect(screen.getByText(/connection refused/)).toBeInTheDocument();
    expect(screen.getByText(/SELECT/)).toBeInTheDocument();
  });

  it('shows Reload Application button', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="err" />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });
});

// ─── System Tests — ErrorBoundary integration with nested trees ─────────────

describe('ErrorBoundary — system boundary', () => {
  it('catches errors from deeply nested children', () => {
    const DeepThrow = () => (
      <div>
        <div>
          <ThrowError message="deep error" />
        </div>
      </div>
    );
    render(
      <ErrorBoundary componentName="Deep Test">
        <DeepThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Deep Test')).toBeInTheDocument();
  });

  it('outer boundary catches when inner has no boundary', () => {
    render(
      <ErrorBoundary componentName="Outer">
        <div>
          <ThrowError message="inner error" />
        </div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Outer')).toBeInTheDocument();
    expect(screen.getByText('inner error')).toBeInTheDocument();
  });
});
