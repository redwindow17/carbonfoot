/**
 * Generates a unique id, preferring the platform's cryptographically strong
 * `crypto.randomUUID` and degrading gracefully where it is unavailable (e.g. an
 * insecure context). Isolated here so the rest of the app stays deterministic
 * and testable.
 */
export function createId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Last-resort fallback; uniqueness is best-effort only.
  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}
