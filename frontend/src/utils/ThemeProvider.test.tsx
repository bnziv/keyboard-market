import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

function TestConsumer() {
  const { theme, toggle } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggle}>Toggle</button>
    </>
  );
}

function renderTheme(initialStorage?: string) {
  if (initialStorage) {
    localStorage.setItem('km_theme', initialStorage);
  } else {
    localStorage.removeItem('km_theme');
  }
  return render(
    <ThemeProvider>
      <TestConsumer />
    </ThemeProvider>,
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to "light" when localStorage has no entry', () => {
    renderTheme();
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('reads the initial theme from localStorage', () => {
    renderTheme('dark');
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('toggles from light to dark', () => {
    renderTheme();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('toggles from dark to light', () => {
    renderTheme('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('persists the theme to localStorage on toggle', () => {
    renderTheme();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(localStorage.getItem('km_theme')).toBe('dark');
  });

  it('sets the data-theme attribute on documentElement', () => {
    renderTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
