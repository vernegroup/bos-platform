import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-product-rail",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Standardy Operacyjne Biznesu",
  description:
    "Gotowe standardy operacyjne dla nowoczesnych przedsiębiorstw.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pl"
      className={`${inter.variable} ${cormorant.variable} ${montserrat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}