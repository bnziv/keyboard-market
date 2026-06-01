import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { capitalizeType, computeCloses, toCardData, toFeaturedCard } from './groupBuyTransforms';
import type { ApiGroupBuy } from '@/types/groupBuy';

// Fixed point in time for all tests
const NOW = new Date('2025-06-01T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('capitalizeType', () => {
  it('capitalizes the first letter', () => {
    expect(capitalizeType('keyboard')).toBe('Keyboard');
  });

  it('returns "Keyboard" for a falsy input', () => {
    expect(capitalizeType('')).toBe('Keyboard');
  });

  it('handles already-capitalized input', () => {
    expect(capitalizeType('Switch')).toBe('Switch');
  });
});

describe('computeCloses', () => {
  it('returns a dash and soon=false when gbEnd is null', () => {
    const result = computeCloses(null);
    expect(result).toEqual({ label: '—', soon: false });
  });

  it('returns Closed and soon=false when gbEnd is in the past', () => {
    const result = computeCloses('2024-01-01T00:00:00.000Z');
    expect(result).toEqual({ label: 'Closed', soon: false });
  });

  it('shows hours-only label when gbEnd is within 48 hours and less than 1 day away', () => {
    // 12 hours from NOW — days=0, so label is "12h"
    const gbEnd = new Date(NOW.getTime() + 12 * 60 * 60 * 1000).toISOString();
    const result = computeCloses(gbEnd);
    expect(result.soon).toBe(true);
    expect(result.label).toMatch(/^\d+h$/);
  });

  it('shows days+hours label when gbEnd is more than 48 hours away', () => {
    // 5 days from NOW
    const gbEnd = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const result = computeCloses(gbEnd);
    expect(result.soon).toBe(false);
    expect(result.label).toMatch(/^\d+d \d+h$/);
  });

  it('marks soon=true exactly at the 48-hour boundary', () => {
    const gbEnd = new Date(NOW.getTime() + 48 * 60 * 60 * 1000 - 1).toISOString();
    const result = computeCloses(gbEnd);
    expect(result.soon).toBe(true);
  });

  it('marks soon=false just over the 48-hour boundary', () => {
    const gbEnd = new Date(NOW.getTime() + 48 * 60 * 60 * 1000 + 1).toISOString();
    const result = computeCloses(gbEnd);
    expect(result.soon).toBe(false);
  });
});

const baseApiGb: ApiGroupBuy = {
  id: 'gb1',
  topicId: 'topic-1',
  name: 'Keychron Q1',
  type: 'keyboard',
  status: 'GB',
  designer: 'Keychron',
  overview: 'Great board',
  gbStart: '2025-01-01T00:00:00.000Z',
  gbEnd: '2099-12-31T00:00:00.000Z',
  estimatedFulfillment: 'Q1 2026',
  basePrice: { amount: 150, currency: 'USD' },
  items: [{ name: 'Base', price: 150, currency: 'USD' }],
  vendors: [{ region: 'US', name: 'Vendor', url: 'https://vendor.com' }],
  discordUrl: 'https://discord.gg/test',
  sourceUrl: 'https://geekhack.org',
  images: ['img1.jpg', 'img2.jpg'],
  scrapedAt: null,
};

describe('toCardData', () => {
  it('maps all required fields from ApiGroupBuy', () => {
    const card = toCardData(baseApiGb);
    expect(card.id).toBe('gb1');
    expect(card.name).toBe('Keychron Q1');
    expect(card.designer).toBe('Keychron');
    expect(card.category).toBe('Keyboard');
    expect(card.stage).toBe('GB');
    expect(card.price).toBe(150);
    expect(card.eta).toBe('Q1 2026');
    expect(card.desc).toBe('Great board');
    expect(card.imageUrl).toBe('img1.jpg');
    expect(card.images).toEqual(['img1.jpg', 'img2.jpg']);
    expect(card.vendors).toHaveLength(1);
    expect(card.items).toHaveLength(1);
    expect(card.discordUrl).toBe('https://discord.gg/test');
  });

  it('falls back gracefully when optional fields are absent', () => {
    const minimal: ApiGroupBuy = {
      ...baseApiGb,
      designer: undefined,
      overview: undefined,
      estimatedFulfillment: null,
      basePrice: null,
      images: [],
      gbEnd: null,
    };
    const card = toCardData(minimal);
    expect(card.designer).toBe('—');
    expect(card.desc).toBe('');
    expect(card.eta).toBe('—');
    expect(card.price).toBe(0);
    expect(card.imageUrl).toBeNull();
  });
});

describe('toFeaturedCard', () => {
  it('maps name, type, status, and first image', () => {
    const card = toFeaturedCard(baseApiGb);
    expect(card.name).toBe('Keychron Q1');
    expect(card.category).toBe('Keyboard');
    expect(card.stage).toBe('GB');
    expect(card.imageUrl).toBe('img1.jpg');
  });

  it('always sets closes to — and closingSoon to false', () => {
    const card = toFeaturedCard(baseApiGb);
    expect(card.closes).toBe('—');
    expect(card.closingSoon).toBe(false);
  });
});
