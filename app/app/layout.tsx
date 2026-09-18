import type { Metadata } from "next";

import AppShell from "@/components/app-shell/AppShell";
import "./app-shell.css";

export const metadata: Metadata = {
  title: "BOS — Panel klienta",
  description: "Środowisko aplikacyjne Business Operating Standards.",
};

export default function BOSAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
