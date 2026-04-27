import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock stores before importing component
vi.mock('../../store', () => ({
  useAuthStore: () => ({ login: vi.fn() }),
  useAppStore: () => ({ addNotification: mockAddNotification }),
}));

const mockAddNotification = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../api', () => ({
  api: {
    register: vi.fn(),
  },
}));

vi.mock('../../supabase', () => ({ supabase: null, isSupabaseConfigured: false }));

import RegisterPage from '../../views/marketing/RegisterPage';
import { api } from '../../api';

const fillForm = async (user: ReturnType<typeof userEvent.setup>, overrides: Record<string, string> = {}) => {
  const values = {
    name: 'Test User',
    email: 'test@example.com',
    company: 'Test Co',
    password: 'SecurePass1!',
    confirm: 'SecurePass1!',
    ...overrides,
  };
  await user.type(screen.getByPlaceholderText('e.g. Amara Osei'), values.name);
  await user.type(screen.getByPlaceholderText('name@company.com'), values.email);
  await user.type(screen.getByPlaceholderText('e.g. Blue Star Logistics'), values.company);
  const passwordInputs = screen.getAllByPlaceholderText('••••••••');
  await user.type(passwordInputs[0], values.password);
  await user.type(passwordInputs[1], values.confirm);
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('RegisterPage — form rendering', () => {
  it('renders all required form fields', () => {
    renderPage();
    expect(screen.getByPlaceholderText('e.g. Amara Osei')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Blue Star Logistics')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
  });

  it('renders the Create Account button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders a sign-in link', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});

// ─── White-box Tests — validation logic ─────────────────────────────────────

describe('RegisterPage — client-side validation', () => {
  beforeEach(() => {
    mockAddNotification.mockClear();
    mockNavigate.mockClear();
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user, { email: 'not-an-email' });
    // fireEvent.submit bypasses JSDOM's HTML5 native email validation
    // so our custom regex validator runs
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.stringContaining('Invalid email'),
        'error'
      );
    });
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user, { password: 'abc', confirm: 'abc' });
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.stringContaining('8 characters'),
        'error'
      );
    });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user, { password: 'SecurePass1!', confirm: 'DifferentPass1!' });
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.stringContaining('do not match'),
        'error'
      );
    });
  });

  it('shows inline mismatch indicator when passwords differ', async () => {
    const user = userEvent.setup();
    renderPage();
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'SecurePass1!');
    await user.type(passwordInputs[1], 'Wrong');
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('does not show mismatch indicator when passwords match', async () => {
    const user = userEvent.setup();
    renderPage();
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'SecurePass1!');
    await user.type(passwordInputs[1], 'SecurePass1!');
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
  });
});

// ─── System Tests — happy path registration ──────────────────────────────────

describe('RegisterPage — happy path', () => {
  beforeEach(() => {
    mockAddNotification.mockClear();
    mockNavigate.mockClear();
    (api.register as any).mockResolvedValue({
      user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
      token: 'jwt-token',
    });
  });

  it('calls api.register with correct form data', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          company: 'Test Co',
          password: 'SecurePass1!',
        })
      );
    });
  });

  it('navigates to /onboarding on successful registration', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('shows success notification on registration', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.stringContaining('Account created'),
        'success'
      );
    });
  });
});

// ─── E2E-style Tests — API error handling ────────────────────────────────────

describe('RegisterPage — API error handling', () => {
  beforeEach(() => {
    mockAddNotification.mockClear();
    mockNavigate.mockClear();
    (api.register as any).mockRejectedValue(new Error('Email already in use'));
  });

  it('shows error notification when API fails', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        'Email already in use',
        'error'
      );
    });
  });

  it('does not navigate on API failure', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
