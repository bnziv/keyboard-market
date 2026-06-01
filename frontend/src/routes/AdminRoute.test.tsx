import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from './AdminRoute';

vi.mock('@/utils/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/utils/AuthProvider';

// Must match the value set in vitest.config.ts define
const ADMIN_ID = 'test-admin-id';

function setup(user: { id: string; username: string } | null, isAuthenticated = true) {

  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: isAuthenticated && user !== null,
    isLoading: false,
    user,
    login: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>admin panel</div>} />
        </Route>
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminRoute', () => {
  it('renders the admin content when the user is the admin', () => {
    setup({ id: ADMIN_ID, username: 'admin' });
    expect(screen.getByText('admin panel')).toBeInTheDocument();
  });

  it('redirects to "/" when the user is not the admin', () => {
    setup({ id: 'regular-user', username: 'user' });
    expect(screen.getByText('home page')).toBeInTheDocument();
    expect(screen.queryByText('admin panel')).not.toBeInTheDocument();
  });

  it('redirects to "/" when not authenticated', () => {
    setup(null, false);
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});
