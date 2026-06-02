const CDN_URL = (import.meta.env.VITE_CDN_URL ?? '').replace(/\/$/, '');

export function imgUrl(url: string, w: number): string;
export function imgUrl(
  url: string | null | undefined,
  w: number,
): string | null;
export function imgUrl(
  url: string | null | undefined,
  w: number,
): string | null {
  if (!url) return null;
  if (!CDN_URL || !url.startsWith(CDN_URL)) return url;
  const path = url.slice(CDN_URL.length);
  return `${CDN_URL}/cdn-cgi/image/width=${w},quality=85,format=auto${path}`;
}
