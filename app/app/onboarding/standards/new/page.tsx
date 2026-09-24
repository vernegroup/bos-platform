export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { createDraftStandard } from "@/lib/bos/onboardingRepository";
import { db } from "@/lib/db";

async function createDraft(formData: FormData) {
  "use server";
  const access = await requireBOSAccess();
  const name = String(formData.get("name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  if (!name) redirect("/app/onboarding/standards/new?error=name");

  const sql = db();
  const products = await sql`SELECT id FROM products WHERE key='onboarding' AND status='ACTIVE' LIMIT 1`;
  if (!products[0]) throw new Error("Produkt BOS Onboarding nie jest skonfigurowany.");

  const standardId = await createDraftStandard({
    organizationId: access.organization.id,
    productId: products[0].id,
    name,
    area,
    createdByUserId: access.user.id,
  });
  redirect(`/app/onboarding/standards/${standardId}`);
}

export default async function NewStandardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const access = await requireBOSAccess();
  const { error } = await searchParams;
  return (
    <>
      <section className="bos-app-intro bos-onboarding-view-head">
        <div>
          <div className="bos-app-kicker">01 / PRZYGOTUJ / NOWY STANDARD</div>
          <h1>Nowy Standard Stanowiska</h1>
          <p>Najpierw utwórz wersję roboczą. Czynności, warunki rozpoczęcia i kryteria gotowości uzupełnisz przed publikacją.</p>
        </div>
        <div className="bos-app-build-state"><span>ORGANIZACJA</span><strong>{access.organization.name}</strong></div>
      </section>

      <form action={createDraft} className="bos-standard-detail-head">
        <div style={{display:"grid",gap:"12px",width:"100%",maxWidth:"720px"}}>
          <label>
            <span className="bos-dashboard-section-kicker">NAZWA STANDARDU</span>
            <input name="name" required maxLength={160} autoFocus placeholder="np. Magazynier" style={{width:"100%",marginTop:"6px",padding:"12px"}} />
          </label>
          <label>
            <span className="bos-dashboard-section-kicker">OBSZAR</span>
            <input name="area" maxLength={160} placeholder="np. Magazyn / Logistyka" style={{width:"100%",marginTop:"6px",padding:"12px"}} />
          </label>
          {error==="name" && <p role="alert">Podaj nazwę Standardu.</p>}
          <div>
            <button type="submit" className="bos-standard-primary-action">UTWÓRZ WERSJĘ ROBOCZĄ</button>
          </div>
        </div>
      </form>

      <div className="bos-onboarding-rule-note">
        <span>STATUS: WERSJA ROBOCZA</span>
        <p>Utworzenie Standardu nie publikuje go i nie pozwala jeszcze uruchomić na nim onboardingu. Publikacja nastąpi dopiero po przejściu kontroli kompletności.</p>
      </div>
    </>
  );
}
