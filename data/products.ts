export type BOSProductKey = "onboarding" | "promotions";

export type BOSProduct = {
  id: BOSProductKey;
  index: string;
  displayName: string;
  name: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  description: string;
  reference: string;
  image: {
    src: string;
    alt: string;
  };
  video: {
    src: string;
    label: string;
  };
  sales: {
    kicker: string;
    title: string;
    description: string;
    benefits: readonly (readonly [string, string])[];
    audience: string;
    steps: readonly (readonly [string, string, string])[];
    demo: string;
  };
  offer: {
    status: "available";
    label: string;
    title: string;
    description: string;
    price: string;
    priceNote: string;
    checkoutEndpoint: string;
    ariaLabel: string;
  };
};

export const bosProducts: readonly BOSProduct[] = [
  {
    id: "onboarding",
    index: "01",
    displayName: "WDROŻENIA",
    name: "BOS Wdrożenia",
    eyebrow: "SYSTEM WDRAŻANIA NOWYCH PRACOWNIKÓW",
    title: "Gotowe rozwiązanie",
    subtitle: "konkretne, praktyczne i pozostające w organizacji na stałe.",
    description:
      "Porządkuje cały proces wdrożenia pracownika — od przygotowania stanowiska, przez pierwszy dzień i przekazanie wiedzy, aż po samodzielną pracę.",
    reference: "STRUKTURA · KONTROLA · POWTARZALNOŚĆ",
    image: {
      src: "/images/hero-office.png",
      alt: "Business Operating Standards",
    },
    video: {
      src: "/videos/onboarding-test.mp4",
      label: "BOS Wdrożenia",
    },
    sales: {
      kicker: "BOS WDROŻENIA",
      title: "Uporządkuj wdrożenie. Skróć drogę do samodzielności.",
      description:
        "BOS Wdrożenia prowadzi menedżera przez przygotowanie, realizację i zamknięcie wdrożenia pracownika w jednym, powtarzalnym procesie.",
      benefits: [
        ["Jeden standard", "Stanowisko, czynności krytyczne i oczekiwany rezultat są zapisane w jednym miejscu."],
        ["Kontrola postępu", "Menedżer widzi etap procesu, realizację zadań i moment gotowości pracownika."],
        ["Mniej improwizacji", "Kolejne wdrożenia wykorzystują ten sam sprawdzony mechanizm zamiast zaczynać od zera."],
      ],
      audience:
        "Dla właścicieli i menedżerów MŚP, którzy chcą wdrażać pracowników w sposób powtarzalny i możliwy do kontrolowania.",
      steps: [
        ["01", "Przygotuj", "Zdefiniuj stanowisko i standard."],
        ["02", "Przeprowadź", "Realizuj kolejne etapy wdrożenia."],
        ["03", "Zamknij", "Zweryfikuj gotowość i zachowaj historię."],
      ],
      demo: "/videos/bos-onboarding-demo.webm",
    },
    offer: {
      status: "available",
      label: "STANDARD OPERACYJNY",
      title: "Kup BOS Wdrożenia",
      description:
        "Roczna licencja na moduł BOS Wdrożenia w aplikacji webowej wraz z aktualizacjami.",
      price: "67,07 zł netto / mies.",
      priceNote: "804,88 zł netto / rok · 990 zł brutto / rok · płatność roczna",
      checkoutEndpoint: "/api/checkout",
      ariaLabel: "Kup BOS Wdrożenia",
    },
  },
  {
    id: "promotions",
    index: "02",
    displayName: "AWANSE",
    name: "BOS Awanse",
    eyebrow: "SYSTEM AWANSÓW WEWNĘTRZNYCH",
    title: "Rozwijaj ludzi. Zachowuj standard.",
    description:
      "BOS Awanse porządkuje proces awansów wewnętrznych, przekazywania nowych obowiązków oraz przygotowania pracowników do kolejnych ról w organizacji.",
    reference: "STRUKTURA · ROZWÓJ · POWTARZALNOŚĆ",
    image: {
      src: "/images/promotions-hero.png",
      alt: "BOS Awanse",
    },
    video: {
      src: "/videos/onboarding-02.mp4",
      label: "BOS Awanse",
    },
    sales: {
      kicker: "BOS AWANSE",
      title: "Zmieniaj role bez utraty kontroli nad procesem.",
      description:
        "BOS Awanse porządkuje awanse i przesunięcia poziome jako proces wejścia pracownika w nową rolę, z własnym standardem i kryterium gotowości.",
      benefits: [
        ["Nowa rola, nowy standard", "Kompetencje wymagane na nowym stanowisku są opisane niezależnie od poprzedniej roli."],
        ["Ciągłość pracownika", "Proces może korzystać z historii osoby w organizacji bez skracania wymagań nowego stanowiska."],
        ["Decyzja oparta na gotowości", "Zamknięcie zmiany następuje po weryfikacji wykonania i gotowości do samodzielnej pracy."],
      ],
      audience:
        "Dla firm, które rozwijają ludzi wewnętrznie i chcą prowadzić awanse oraz przesunięcia według jasnego, udokumentowanego procesu.",
      steps: [
        ["01", "Przygotuj zmianę", "Wybierz osobę, rolę i standard."],
        ["02", "Przeprowadź", "Realizuj wymagania nowego stanowiska."],
        ["03", "Zweryfikuj", "Zamknij zmianę po potwierdzeniu gotowości."],
      ],
      demo: "/videos/bos-promotions-demo.webm",
    },
    offer: {
      status: "available",
      label: "STANDARD OPERACYJNY",
      title: "Kup BOS Awanse",
      description:
        "Roczna licencja na moduł BOS Awanse w aplikacji webowej wraz z aktualizacjami.",
      price: "46,75 zł netto / mies.",
      priceNote: "560,98 zł netto / rok · 690 zł brutto / rok · płatność roczna",
      checkoutEndpoint: "/api/checkout-promotions",
      ariaLabel: "Kup BOS Awanse",
    },
  },
];

export const plannedBosProducts = [
  { id: "pricing", displayName: "CENY" },
] as const;

export function getBOSProduct(productId: BOSProductKey): BOSProduct {
  const product = bosProducts.find(({ id }) => id === productId);
  if (!product) {
    throw new Error(`Unknown BOS product: ${productId}`);
  }
  return product;
}
