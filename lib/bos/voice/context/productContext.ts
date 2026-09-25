export type VoiceProduct = "onboarding" | "promotions" | null;

export type VoiceProductContext = {
  currentProduct: VoiceProduct;
  capturedAt: number;
};

const PRODUCT_SEGMENTS: Array<[string, Exclude<VoiceProduct, null>]> = [
  ["onboarding", "onboarding"],
  ["promotions", "promotions"],
];

export function resolveCurrentProduct(pathname: string | null | undefined): VoiceProduct {
  if (!pathname) return null;
  const segments = pathname.toLowerCase().split(/[/?#]/).filter(Boolean);
  for (const [segment, product] of PRODUCT_SEGMENTS) {
    if (segments.includes(segment)) return product;
  }
  return null;
}

export function createVoiceProductContext(pathname: string | null | undefined): VoiceProductContext {
  return { currentProduct: resolveCurrentProduct(pathname), capturedAt: Date.now() };
}
