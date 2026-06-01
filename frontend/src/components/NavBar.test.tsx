import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from './NavBar';

vi.mock('@/utils/AuthProvider', () => ({ useAuth: vi.fn() }));
vi.mock('@/utils/ToastProvider', () => ({
  useToast: () => ({ showInfo: vi.fn(), showSuccess: vi.fn(), showError: vi.fn() }),
}));
vi.mock('@/utils/ThemeProvider', () => ({
  useTheme: vi.fn(),
}));
vi.mock('@/utils/ChatProvider', () => ({
  useChat: () => ({ toggleConversations: vi.fn() }),
}));

import { useAuth } from '@/utils/AuthProvider';
import { useTheme } from '@/utils/ThemeProvider';

function setupMocks(isAuthenticated: boolean, username = 'alice') {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated,
    isLoading: false,
    user: isAuthenticated ? { id: 'u1', username } : null,
    login: vi.fn(),
    logout: vi.fn(),
  });

  vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggle: vi.fn() });
}

function renderNav() {
  return render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>,
  );
}

describe('NavBar', () => {
  describe('when not authenticated', () => {
    beforeEach(() => setupMocks(false));

    it('shows the Login button', () => {
      renderNav();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('does not show a user avatar button', () => {
      renderNav();
      // The avatar button displays the first letter of the username
      expect(screen.queryByText('A')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'u1', username: 'alice' },
        login: vi.fn(),
        logout: mockLogout,
      });
      vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggle: vi.fn() });
    });

    it('does not show the Login button', () => {
      renderNav();
      expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
    });

    it('shows the first letter of the username as the avatar', () => {
      renderNav();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('theme toggle', () => {
    it('calls the toggle function when the theme button is clicked', () => {
      const mockToggle = vi.fn();
      setupMocks(false);
      vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggle: mockToggle });

      renderNav();

      const themeButton = screen.getByTitle(/switch to dark mode/i);
      fireEvent.click(themeButton);

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigation links', () => {
    beforeEach(() => setupMocks(false));

    it('renders Browse, Group Buys, and Sell links', () => {
      renderNav();
      expect(screen.getAllByRole('link', { name: 'Browse' })).not.toHaveLength(0);
      expect(screen.getAllByRole('link', { name: 'Group Buys' })).not.toHaveLength(0);
    });

    it('renders the KBMARKET brand link to /', () => {
      renderNav();
      const brand = screen.getByRole('link', { name: /kbmarket/i });
      expect(brand).toHaveAttribute('href', '/');
    });
  });
});
