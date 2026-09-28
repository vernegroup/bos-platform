import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrganizationStandardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ standardId: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const { standardId } = await params;
  const { returnTo } = (await searchParams) ?? {};
  const query = returnTo === "promotions" ? "?returnTo=promotions" : "";
  redirect(`/app/onboarding/standards/${standardId}${query}`);
}
