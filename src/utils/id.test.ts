import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './id';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createId', () => {
  it('prefers crypto.randomUUID when the platform provides it', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'stub-uuid-1234' });
    expect(createId()).toBe('stub-uuid-1234');
  });

  it('falls back to getRandomValues, formatting 16 bytes as hex', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(0xab);
        return bytes;
      },
    });
    const id = createId();
    expect(id).toBe('ab'.repeat(16));
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('falls back to a timestamp-based id when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(createId()).toMatch(/^id-/);
  });

  it('produces distinct ids on the real platform implementation', () => {
    expect(createId()).not.toBe(createId());
  });
});
