import { describe, expect, it, vi } from 'vitest';
import { enableOfflinePersistence } from './offlinePersistence';

describe('enableOfflinePersistence', () => {
  it('marks persistence as enabled when Firestore accepts it', async () => {
    const enable = vi.fn().mockResolvedValue(undefined);

    const result = await enableOfflinePersistence({} as never, enable);

    expect(result).toEqual({ enabled: true });
    expect(enable).toHaveBeenCalledTimes(1);
  });

  it('reports multi-tab persistence conflicts without throwing', async () => {
    const enable = vi.fn().mockRejectedValue({ code: 'failed-precondition' });

    const result = await enableOfflinePersistence({} as never, enable);

    expect(result).toEqual({
      enabled: false,
      reason: 'multiple-tabs',
    });
  });
});
