const AUTH_LOADING_PUBLIC_ROUTES = new Set(['/']);

export function canRenderBeforeAuthReady(pathname: string): boolean {
  return AUTH_LOADING_PUBLIC_ROUTES.has(pathname);
}
