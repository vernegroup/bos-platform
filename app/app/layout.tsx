import type { Metadata } from "next";

import AppShell from "@/components/app-shell/AppShell";
import { requireBOSAccess } from "@/lib/bos/access";
import "./app-shell.css";
import "../public-products.css";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";

export const metadata: Metadata = {
  title: "BOS — Panel klienta",
  description: "Środowisko aplikacyjne Business Operating Standards.",
};

export default async function BOSAppLayout({ children }: { children: React.ReactNode }) {
  const access = await requireBOSAccess();
  const licensedProducts = await listLicensedProducts(access);
  const account = {
    name: access.user.displayName,
    email: access.user.email,
    image: null,
    role: access.membership.role,
  };

  return (
    <AppShell account={account} organizationName={access.organization.name} licensedProductKeys={licensedProducts.map(product=>product.key)}>
      {children}
    </AppShell>
  );
}
