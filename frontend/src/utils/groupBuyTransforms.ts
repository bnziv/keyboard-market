import type { ApiGroupBuy, AdminGroupBuy } from '@/types/groupBuy';
import type { CardGroupBuy } from '@/components/GroupBuyCard';

export function capitalizeType(type: string): string {
  if (!type) return 'Keyboard';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function computeCloses(gbEnd: string | null): { label: string; soon: boolean } {
  if (!gbEnd) return { label: '—', soon: false };
  const end = new Date(gbEnd);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return { label: 'Closed', soon: false };
  const diffHours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(diffHours / 24);
  const hours = Math.floor(diffHours % 24);
  const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  return { label, soon: diffHours <= 48 };
}

export function toCardData(gb: ApiGroupBuy): CardGroupBuy {
  const { label: closes, soon: closingSoon } = computeCloses(gb.gbEnd);
  const stage = gb.status as 'IC' | 'GB' | 'closed';
  return {
    id: gb.id,
    name: gb.name,
    designer: gb.designer ?? '—',
    category: capitalizeType(gb.type),
    stage,
    price: gb.basePrice?.amount ?? 0,
    closes,
    gbStartMs: gb.gbStart ? new Date(gb.gbStart).getTime() : null,
    gbEndMs: gb.gbEnd ? new Date(gb.gbEnd).getTime() : null,
    gbStartIso: gb.gbStart,
    gbEndIso: gb.gbEnd,
    closingSoon,
    eta: gb.estimatedFulfillment ?? '—',
    desc: gb.overview ?? '',
    sourceUrl: gb.sourceUrl,
    imageUrl: gb.images?.[0] ?? null,
    images: gb.images ?? [],
    vendors: gb.vendors ?? [],
    discordUrl: gb.discordUrl ?? null,
    items: gb.items ?? [],
  };
}

export function toFeaturedCard(gb: ApiGroupBuy): CardGroupBuy {
  const category = capitalizeType(gb.type);
  return {
    id: gb.id,
    name: gb.name,
    designer: gb.designer,
    category,
    stage: gb.status as 'GB' | 'IC' | 'closed',
    price: gb.basePrice?.amount ?? 0,
    imageUrl: gb.images?.[0] ?? null,
    images: gb.images ?? [],
    closes: '—',
    closingSoon: false,
    eta: '—',
    desc: '',
    gbStartMs: null,
    gbEndMs: null,
    gbStartIso: null,
    gbEndIso: null,
    sourceUrl: '',
    vendors: [],
    discordUrl: null,
    items: [],
  };
}

export function toImportPayload(item: AdminGroupBuy) {
  return {
    topic_id: item.topicId || undefined,
    name: item.name || undefined,
    type: item.type || undefined,
    status: item.status || undefined,
    designer: item.designer || undefined,
    overview: item.overview || undefined,
    poster: item.poster || undefined,
    gb_start: item.gbStart || undefined,
    gb_end: item.gbEnd || undefined,
    estimated_fulfillment: item.estimatedFulfillment || undefined,
    base_price: item.basePrice || undefined,
    items: item.items,
    vendors: item.vendors,
    discord_url: item.discordUrl || undefined,
    source_url: item.sourceUrl || undefined,
    images: item.images,
    excludedImages: item.excludedImages,
  };
}
