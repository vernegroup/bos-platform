import type { Metadata } from "next";

import { auth } from "@/auth";
import AppShell from "@/components/app-shell/AppShell";
import "./app-shell.css";

export const metadata: Metadata = {
  title: "BOS — Panel klienta",
  description: "Środowisko aplikacyjne Business Operating Standards.",
};

export default async function BOSAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const account = {
    name: session?.user?.name ?? "Użytkownik BOS",
    email: session?.user?.email ?? "",
    image: session?.user?.image ?? null,
  };
  return <AppShell account={account}>{children}</AppShell>;
}
