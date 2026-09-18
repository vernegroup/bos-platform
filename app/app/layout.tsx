import type { Metadata } from "next";

import AppShell from "@/components/app-shell/AppShell";
import { requireBOSAccess } from "@/lib/bos/access";
import "./app-shell.css";

export const metadata: Metadata = {
  title: "BOS — Panel klienta",
  description: "Środowisko aplikacyjne Business Operating Standards.",
};

export default async function BOSAppLayout({ children }: { children: React.ReactNode }) {
  const access = await requireBOSAccess();
  const account = {
    name: access.user.displayName,
    email: access.user.email,
    image: null,
  };
  return <AppShell account={account}>{children}</AppShell>;
}
