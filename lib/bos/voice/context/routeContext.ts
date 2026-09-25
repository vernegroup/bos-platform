export type VoiceRouteContext = {
  currentRoute: string;
  capturedAt: number;
};

export function normalizeVoiceRoute(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  const clean = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (clean === "/") return "/";
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

export function createVoiceRouteContext(pathname: string | null | undefined): VoiceRouteContext {
  return { currentRoute: normalizeVoiceRoute(pathname), capturedAt: Date.now() };
}
