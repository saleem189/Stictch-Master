import { describe, expect, it } from 'vitest';
import { canRenderBeforeAuthReady } from './publicRoutes';

describe('public routes', () => {
  it('allows the public storefront to render before auth finishes loading', () => {
    expect(canRenderBeforeAuthReady('/')).toBe(true);
  });

  it('keeps protected client and admin routes behind auth loading', () => {
    expect(canRenderBeforeAuthReady('/client')).toBe(false);
    expect(canRenderBeforeAuthReady('/client/request-quote')).toBe(false);
    expect(canRenderBeforeAuthReady('/admin')).toBe(false);
  });
});
