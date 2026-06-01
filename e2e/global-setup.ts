import type { FullConfig } from '@playwright/test';

export default async function globalSetup(_config: FullConfig) {
  const url = 'http://localhost:8080/health';
  const maxAttempts = 40;
  const delayMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw new Error(`Backend did not become ready at ${url} within ${(maxAttempts * delayMs) / 1000}s`);
}
