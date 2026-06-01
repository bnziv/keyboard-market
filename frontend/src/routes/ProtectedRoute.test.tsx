import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock auth and toast so we can control auth state without full providers
vi.mock('@/utils/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/utils/ToastProvider', () => ({
  useToast: () => ({ showInfo: vi.fn(), showSuccess: vi.fn(), showError: vi.fn() }),
}));

import { useAuth } from '@/utils/AuthProvider';

function setup(isAuthenticated: boolean, isLoading = false) {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated,
    isLoading,
    user: isAuthenticated ? { id: 'u1', username: 'tester' } : null,
    login: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>protected content</div>} />
        </Route>
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('renders the child route when the user is authenticated', async () => {
    setup(true);
    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });
  });

  it('redirects to "/" when the user is not authenticated', async () => {
    setup(false);
    await waitFor(() => {
      expect(screen.getByText('home page')).toBeInTheDocument();
    });
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('shows the loading screen while auth is being checked', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // LoadingScreen renders while isLoading is true — protected content must not be visible
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });
});
