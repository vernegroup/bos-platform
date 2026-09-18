import { requireBOSAccess } from "@/lib/bos/access";
import { getCurrentProductVersions, listProductUpdates } from "@/lib/bos/productUpdateRepository";

export const dynamic="force-dynamic";
const datePL=(value:string)=>new Intl.DateTimeFormat("pl-PL",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));

export default async function UpdatesPage(){
 const access=await requireBOSAccess();
 const [updates,versions]=await Promise.all([listProductUpdates(access),getCurrentProductVersions(access)]);
 return <div className="bos-app-workspace">
  <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / AKTUALIZACJE</div><h1>Aktualizacje</h1><p>Historia zmian dostarczanych centralnie do produktów objętych licencją organizacji.</p></div><div className="bos-app-build-state"><span>PRODUKTY</span><strong>{versions.length} LICENCJONOWANE</strong></div></section>
  <section className="bos-update-versions">
   {versions.map(v=><div className="bos-update-version" key={v.key}><span>{v.key.toUpperCase()}</span><strong>{v.currentVersion??"—"}</strong><small>{v.latestUpdateAt?`OSTATNIA PUBLIKACJA ${datePL(v.latestUpdateAt)}`:"BRAK OPUBLIKOWANEJ HISTORII"}</small></div>)}
  </section>
  <section className="bos-update-history">
   <header><span>HISTORIA WERSJI</span><strong>{updates.length}</strong></header>
   {!updates.length?<p className="bos-global-search-empty">Nie opublikowano jeszcze wpisów aktualizacji dla posiadanych produktów.</p>:updates.map(u=><article className="bos-update-row" key={u.id}>
    <time>{datePL(u.publishedAt)}</time><span className="bos-update-product">{u.productName}</span><div><strong>{u.version} · {u.title}</strong><p>{u.description}</p></div><b>{u.isCurrent?"BIEŻĄCA":"HISTORIA"}</b>
   </article>)}
  </section>
 </div>;
}
