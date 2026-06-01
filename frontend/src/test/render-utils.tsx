import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { ToastProvider } from '@/utils/ToastProvider';
import { ThemeProvider } from '@/utils/ThemeProvider';
import { ChatProvider } from '@/utils/ChatProvider';

interface WrapperOptions {
  routerProps?: MemoryRouterProps;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { routerProps, ...renderOptions }: WrapperOptions & RenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter {...routerProps}>
        <ThemeProvider>
          <ToastProvider>
            <ChatProvider>{children}</ChatProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
