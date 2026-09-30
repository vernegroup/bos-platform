import { redirect } from "next/navigation";

export default async function LegacyOnboardingNewStandardVersionRoute({params}:{params:Promise<{standardId:string}>}){
  const {standardId}=await params;
  redirect(`/app/standards/${standardId}/new-version`);
}
