export type HelpProduct = "core" | "onboarding" | "promotions";
export type HelpContext = {
  product: HelpProduct;
  screen: string;
  stage?: "prepare" | "conduct" | "close";
  element?: string;
  state?: string;
};
export type HelpScreen = Pick<HelpContext, "product" | "screen" | "stage"> & { title: string; summary: string };
const match = (path: string, root: string) => path === root || path.startsWith(root + "/");

/** Route-only fallback. Process state and element focus must be supplied by the product,
 * not inferred from a URL or read from the DOM. No personal or record data is exposed. */
export function resolveHelpScreen(pathname: string): HelpScreen {
  if (match(pathname, "/app/onboarding/standards") || match(pathname, "/app/standards"))
    return { product: "onboarding", screen: "standards", stage: "prepare", title: "Standardy stanowisk", summary: "Przygotuj wzorzec pracy stanowiska przed rozpoczęciem wdrożenia." };
  if (match(pathname, "/app/onboarding/processes")) {
    const screen = pathname.endsWith("/new") ? "process-new" : pathname === "/app/onboarding/processes" ? "process-list" : pathname.endsWith("/close") ? "process-close" : "process-detail";
    return { product: "onboarding", screen, stage: screen === "process-close" ? "close" : "conduct", title: "Wdrożenia", summary: "Realizuj etapy pracy według przypisanej wersji Standardu Stanowiska." };
  }
  if (match(pathname, "/app/onboarding/closed"))
    return { product: "onboarding", screen: pathname === "/app/onboarding/closed" ? "history" : "closure-detail", stage: "close", title: "Historia wdrożeń", summary: "Przeglądaj decyzje i trwałe rekordy zakończenia." };
  if (match(pathname, "/app/onboarding"))
    return { product: "onboarding", screen: "overview", title: "BOS Wdrożenia", summary: "Przygotuj standard, przeprowadź wdrożenie i zweryfikuj zakończenie." };
  if (match(pathname, "/app/promotions/processes")) {
    const screen = pathname.endsWith("/new") ? "process-new" : pathname === "/app/promotions/processes" ? "process-list" : "process-detail";
    return { product: "promotions", screen, stage: "conduct", title: "Zmiana roli A → B", summary: "Przeprowadź ocenę wejściową, wdrożenie, weryfikację gotowości i przekazanie obowiązków." };
  }
  if (match(pathname, "/app/promotions/closed"))
    return { product: "promotions", screen: pathname === "/app/promotions/closed" ? "history" : "closure-detail", stage: "close", title: "Historia zmian roli", summary: "Przeglądaj decyzje i zakończone procesy zmiany stanowiska." };
  if (match(pathname, "/app/promotions"))
    return { product: "promotions", screen: "overview", title: "BOS Awanse", summary: "Prowadź awanse i przesunięcia poziome w kontrolowanym procesie A → B." };
  return { product: "core", screen: pathname === "/app" ? "dashboard" : "general", title: "Pomoc BOS", summary: "Wybierz produkt lub ekran, aby wyświetlić pomoc dotyczącą tego obszaru." };
}
