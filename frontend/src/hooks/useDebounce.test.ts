import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update the debounced value before the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } },
    );

    rerender({ value: 'updated', delay: 300 });

    // Advance timer by less than the delay
    act(() => { vi.advanceTimersByTime(200); });

    expect(result.current).toBe('initial');
  });

  it('updates the debounced value after the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } },
    );

    rerender({ value: 'updated', delay: 300 });

    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('updated');
  });

  it('resets the timer when the value changes before the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } },
    );

    rerender({ value: 'b', delay: 300 });
    act(() => { vi.advanceTimersByTime(200); });

    rerender({ value: 'c', delay: 300 });
    act(() => { vi.advanceTimersByTime(200); });

    // Only 200ms have passed since the last change — still 'a'
    expect(result.current).toBe('a');

    // Advance the remaining 100ms to complete 300ms after the 'c' change
    act(() => { vi.advanceTimersByTime(100); });

    expect(result.current).toBe('c');
  });

  it('works with numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } },
    );

    rerender({ value: 42, delay: 500 });
    act(() => { vi.advanceTimersByTime(500); });

    expect(result.current).toBe(42);
  });
});
