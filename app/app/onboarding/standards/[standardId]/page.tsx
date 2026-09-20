export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStandard, updateDraftStandard } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

async function updateDraft(formData: FormData) {
  "use server";
  const access = await requireBOSAccess();
  const standardId = String(formData.get("standardId") ?? "");
  await updateDraftStandard({
    organizationId: access.organization.id,
    standardId,
    name: String(formData.get("name") ?? ""),
    area: String(formData.get("area") ?? ""),
  });
}

export default async function StandardDetailPage({
  params,
}: {
  params: Promise<{ standardId: string }>;
}) {
  const access = await requireBOSAccess();
  const { standardId } = await params;
  const standard = await getStandard(standardId, access.organization.id);
  if (!standard) notFound();

  const current = standard.versions.find((version) => version.version === standard.currentVersion) ?? standard.versions[0];
  if (!current) notFound();
  const isDraft = current.status === "DRAFT";

  return (
    <>
      <div className="bos-standard-back"><Link href="/app/onboarding/standards">← STANDARDY STANOWISK</Link></div>

      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / ONBOARDING / STANDARD</div>
          <h1>{standard.name}</h1>
          <p>{standard.area} · aktywna wersja {standard.currentVersion} · aktualizacja {standard.updatedAt}</p>
        </div>
        <div className="bos-app-build-state"><span>STATUS</span><strong>{standard.status}</strong></div>
      </section>

      {isDraft && (
        <form action={updateDraft} className="bos-standard-detail-head">
          <input type="hidden" name="standardId" value={standard.id} />
          <div style={{display:"grid",gap:"10px",width:"100%",maxWidth:"720px"}}>
            <span className="bos-dashboard-section-kicker">WERSJA ROBOCZA — DANE PODSTAWOWE</span>
            <input name="name" required maxLength={160} defaultValue={standard.name} style={{padding:"10px"}} />
            <input name="area" maxLength={160} defaultValue={standard.area} placeholder="Obszar" style={{padding:"10px"}} />
            <div><button type="submit" className="bos-standard-primary-action">ZAPISZ DRAFT</button></div>
          </div>
        </form>
      )}

      <nav className="bos-standard-tabs" aria-label="Sekcje standardu">
        <span className="is-active">CZYNNOŚCI</span>
        <span>SZCZEGÓŁY</span>
        <span>PLIKI</span>
        <a href="#historia">HISTORIA WERSJI</a>
      </nav>

      <section className="bos-standard-detail-head">
        <div>
          <span className="bos-dashboard-section-kicker">AKTYWNA WERSJA</span>
          <h2>{current.version}</h2>
          <p>{current.note}</p>
        </div>
        <div><span>CZYNNOŚCI</span><strong>{current.tasks.length}</strong></div>
        {!isDraft && <Link href={`/app/onboarding/standards/${standard.id}/new-version`} className="bos-standard-primary-action">UTWÓRZ NOWĄ WERSJĘ</Link>}
      </section>

      <section className="bos-standard-task-table" aria-label="Czynności Standardu Stanowiska">
        <div className="bos-standard-task-head">
          <span>LP.</span><span>CZYNNOŚĆ</span><span>PRAWIDŁOWE WYKONANIE</span><span>KRYTERIUM GOTOWOŚCI</span>
        </div>
        {current.tasks.map((task) => (
          <div className="bos-standard-task-row" key={task.id}>
            <span>{String(task.order).padStart(2, "0")}</span>
            <strong>{task.name}</strong>
            <p>{task.execution}</p>
            <p>{task.readyWhen}</p>
          </div>
        ))}
      </section>

      <section id="historia" className="bos-standard-history">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">WERSJONOWANIE</span><h2>Historia wersji</h2></div>
          <span className="bos-dashboard-count">{standard.versions.length} wersje</span>
        </div>
        {standard.versions.map((version) => (
          <div className="bos-standard-version-row" key={version.version}>
            <strong>{version.version}</strong>
            <time>{version.date}</time>
            <p>{version.note}</p>
            <span>{version.tasks.length} czynności</span>
            <b>{version.version === standard.currentVersion ? "AKTYWNA" : "ARCHIWALNA"}</b>
          </div>
        ))}
      </section>
    </>
  );
}
