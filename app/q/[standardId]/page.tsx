import { auth } from "@/auth";import { redirect } from "next/navigation";
export const dynamic="force-dynamic";
export default async function WorkstationQrRoute({params}:{params:Promise<{standardId:string}>}){const {standardId}=await params;const destination=`/app/onboarding/standards/${standardId}`;const session=await auth();if(!session?.user)redirect(`/login?callbackUrl=${encodeURIComponent(destination)}`);redirect(destination);}
