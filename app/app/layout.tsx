import type { Metadata } from "next";

import AppShell from "@/components/app-shell/AppShell";
import SessionIdleGuard from "@/components/app-shell/SessionIdleGuard";
import { requireBOSAccess } from "@/lib/bos/access";
import "./app-shell.css";
import "./product-modal.css";
import "../public-products.css";
import { listProductEntitlements } from "@/lib/bos/licenseRepository";

export const metadata: Metadata = {
  title: "BOS — Panel klienta",
  description: "Środowisko aplikacyjne Business Operating Standards.",
};

export default async function BOSAppLayout({ children }: { children: React.ReactNode }) {
  const access = await requireBOSAccess();
  const productEntitlements = await listProductEntitlements(access);
  const account = {
    name: access.user.displayName,
    email: access.user.email,
    image: null,
    role: access.membership.role,
  };

  return (
    <>
      <SessionIdleGuard />
      <AppShell account={account} organizationName={access.organization.name} productEntitlements={productEntitlements}>
      {children}
      </AppShell>
    </>
  );
}
