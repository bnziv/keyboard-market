import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDate, titleCase } from './helpers';

describe('formatDate', () => {
  it('returns empty string for a falsy input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(undefined as any)).toBe('');
  });

  it('formats a date in the current year without the year component', () => {
    const thisYear = new Date().getFullYear();
    // Use noon UTC to avoid midnight-crossing timezone edge cases
    const result = formatDate(`${thisYear}-06-15T12:00:00.000Z`);
    expect(result).toMatch(/Jun|June/);
    expect(result).toMatch(/15/);
    expect(result).not.toMatch(String(thisYear));
  });

  it('includes the year for a date in a different year', () => {
    const result = formatDate('2020-03-10T00:00:00.000Z');
    expect(result).toMatch(/2020/);
  });
});

describe('titleCase', () => {
  it('capitalizes the first letter of each word', () => {
    expect(titleCase('hello world')).toBe('Hello World');
  });

  it('lowercases the rest of each word', () => {
    expect(titleCase('HELLO WORLD')).toBe('Hello World');
  });

  it('handles a single word', () => {
    expect(titleCase('keyboard')).toBe('Keyboard');
  });

  it('handles a string that is already title-cased', () => {
    expect(titleCase('Keychron Q1')).toBe('Keychron Q1');
  });

  it('handles an empty string', () => {
    expect(titleCase('')).toBe('');
  });
});
