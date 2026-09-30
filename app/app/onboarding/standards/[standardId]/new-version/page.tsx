import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { createDraftStandardVersion, getStandard } from "@/lib/bos/onboardingRepository";

function text(formData:FormData,key:string){return String(formData.get(key)??"").trim();}

async function createVersion(formData:FormData){
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await createDraftStandardVersion({
    organizationId:access.organization.id,
    standardId,
    createdByUserId:access.user.id,
    changeNote:text(formData,"changeNote")
  });
  redirect(`/app/onboarding/standards/${standardId}`);
}

export default async function NewVersionPage({params}:{params:Promise<{standardId:string}>}){
  const access=await requireBOSAccess(); const {standardId}=await params;
  const standard=await getStandard(standardId,access.organization.id); if(!standard) notFound();
  const current=standard.versions.find(v=>v.version===standard.currentVersion)??standard.versions[0]; if(!current) notFound();
  const canCreate=current.status==="PUBLISHED";
  const statusLabel=current.status==="PUBLISHED"?"OPUBLIKOWANA":current.status==="DRAFT"?"ROBOCZA":"ARCHIWALNA";
  return <>
    <div className="bos-standard-back"><Link href={`/app/onboarding/standards/${standard.id}`}>← WRÓĆ DO STANDARDU</Link></div>
    <section className="bos-app-intro"><div><div className="bos-app-kicker">WERSJONOWANIE STANDARDU</div>
      <h1>Nowa wersja standardu</h1>
      <p>{standard.name} · źródło {current.version}</p></div>
      <div className="bos-app-build-state"><span>ŹRÓDŁO</span><strong>{statusLabel}</strong></div>
    </section>
    <section className="bos-standard-detail-head">
      <div style={{display:"grid",gap:10,width:"100%",maxWidth:760}}>
        <span className="bos-dashboard-section-kicker">KOPIA OPUBLIKOWANEJ WERSJI</span>
        <h2>{canCreate?`Utwórz v${current.versionNumber+1}`:"Nowa wersja jest niedostępna"}</h2>
        <p>Nowa wersja robocza otrzyma kopię czynności, warunków rozpoczęcia i kryteriów gotowości. Opublikowana wersja źródłowa pozostanie niezmieniona, a rozpoczęte onboardingi zachowają swoje dotychczasowe powiązanie.</p>
        {canCreate?<form action={createVersion} style={{display:"grid",gap:10}}>
          <input type="hidden" name="standardId" value={standard.id}/>
          <textarea name="changeNote" required rows={3} maxLength={1000} placeholder="Opisz, co ma zostać zmienione w nowej wersji." style={{padding:10}}/>
          <div><button type="submit" className="bos-standard-primary-action">UTWÓRZ WERSJĘ ROBOCZĄ</button></div>
        </form>:<p>Najpierw zakończ i opublikuj bieżącą wersję roboczą.</p>}
      </div>
    </section>
  </>;
}
