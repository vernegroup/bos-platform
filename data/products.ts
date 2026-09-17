export type BOSProduct = {
  id: "onboarding" | "promotions";
  index: string;
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
  purchase: {
    label: string;
    title: string;
    description: string;
    checkoutEndpoint: string;
    ariaLabel: string;
  };
};

export const bosProducts: BOSProduct[] = [
  {
    id: "onboarding",
    index: "01",
    name: "BOS Onboarding",
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
      label: "BOS Onboarding",
    },
    purchase: {
      label: "STANDARD OPERACYJNY",
      title: "Kup BOS Onboarding",
      description:
        "Kompletny system onboardingu dla małych i średnich firm.",
      checkoutEndpoint: "/api/checkout",
      ariaLabel: "Kup BOS Onboarding",
    },
  },
  {
    id: "promotions",
    index: "02",
    name: "BOS Promotions",
    eyebrow: "SYSTEM AWANSÓW WEWNĘTRZNYCH",
    title: "Rozwijaj ludzi. Zachowuj standard.",
    description:
      "BOS Promotions porządkuje proces awansów wewnętrznych, przekazywania nowych obowiązków oraz przygotowania pracowników do kolejnych ról w organizacji.",
    reference: "STRUKTURA · ROZWÓJ · POWTARZALNOŚĆ",
    image: {
      src: "/images/promotions-hero.png",
      alt: "BOS Promotions",
    },
    video: {
      src: "/videos/onboarding-02.mp4",
      label: "BOS Promotions",
    },
    purchase: {
      label: "STANDARD OPERACYJNY",
      title: "Kup BOS Promotions",
      description:
        "Kompletny system wspierający planowanie awansów wewnętrznych, przekazywanie obowiązków oraz rozwój pracowników w organizacji.",
      checkoutEndpoint: "/api/checkout-promotions",
      ariaLabel: "Kup BOS Promotions",
    },
  },
];
