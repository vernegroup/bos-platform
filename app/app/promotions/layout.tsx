import { requireBOSAccess } from "@/lib/bos/access";
import { requireProductLicense } from "@/lib/bos/licenseRepository";

export default async function PromotionsLayout({ children }: { children: React.ReactNode }) {
  const access = await requireBOSAccess();
  await requireProductLicense(access, "promotions");
  return children;
}
