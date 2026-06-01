import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/handlers';
import { AuthProvider, useAuth } from './AuthProvider';
import { ToastProvider } from './ToastProvider';

function AuthConsumer() {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="username">{user?.username ?? 'null'}</span>
    </div>
  );
}

function renderAuth() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('AuthProvider', () => {
  it('sets isAuthenticated=true and stores the user when /auth/me returns 200', async () => {
    renderAuth();

    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('testuser');
  });

  it('stays unauthenticated when /auth/me returns 401', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
    );

    renderAuth();

    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('username').textContent).toBe('null');
  });

  it('shows the loading screen while the auth check is in progress', () => {
    server.use(
      http.get('/api/auth/me', async () => {
        // Delay resolution — never resolves in this test
        await new Promise(() => {});
        return HttpResponse.json({});
      }),
    );

    renderAuth();

    // The AuthProvider renders <LoadingScreen /> while loading — it shows "Loading..."
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

function LoginConsumer() {
  const { isAuthenticated, user, login } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="username">{user?.username ?? 'null'}</span>
      <button
        onClick={() => login({ id: 'u2', username: 'logged-in-user' })}
      >
        login
      </button>
    </div>
  );
}

describe('AuthProvider.login()', () => {
  it('updates isAuthenticated and user on login', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
    );

    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <LoginConsumer />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    act(() => {
      screen.getByRole('button', { name: 'login' }).click();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('logged-in-user');
  });
});
