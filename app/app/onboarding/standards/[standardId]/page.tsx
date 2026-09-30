import { redirect } from "next/navigation";

export const dynamic="force-dynamic";

export default async function LegacyOnboardingStandardRoute({
  params,searchParams
}:{params:Promise<{standardId:string}>;searchParams?:Promise<{returnTo?:"promotions"|"onboarding";version?:string}>}){
  const {standardId}=await params;
  const query=await searchParams;
  const search=new URLSearchParams();
  if(query?.returnTo) search.set("returnTo",query.returnTo);
  if(query?.version) search.set("version",query.version);
  const suffix=search.toString()?`?${search.toString()}`:"";
  redirect(`/app/standards/${standardId}${suffix}`);
}
