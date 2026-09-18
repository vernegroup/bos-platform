import { requireBOSAccess } from "@/lib/bos/access";
import { requireProductLicense } from "@/lib/bos/licenseRepository";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const access = await requireBOSAccess();
  await requireProductLicense(access, "onboarding");
  return children;
}
