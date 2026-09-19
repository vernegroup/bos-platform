import type { BOSProduct } from "@/data/products";

const previews={
 onboarding:{label:"BOS ONBOARDING / APLIKACJA",title:"Proces wdrożenia",metric:"3 ETAPY",rows:[["PRZYGOTUJ","Standard Stanowiska"],["PRZEPROWADŹ","Karta postępu pracownika"],["ZAMKNIJ","Weryfikacja i historia"]]},
 promotions:{label:"BOS PROMOTIONS / APLIKACJA",title:"Zmiana stanowiska",metric:"2 TYPY",rows:[["AWANS","Zmiana pionowa"],["PRZESUNIĘCIE","Zmiana pozioma"],["HISTORIA","Weryfikacja i zapis"]]},
} as const;

export default function ProductPlatformPreview({product}:{product:BOSProduct}){
 const p=previews[product.id];
 return <div className="bos-platform-preview" aria-label={"Podgląd aplikacji "+product.name}>
  <header><span>{p.label}</span><b>WEB 1.0</b></header>
  <div className="bos-platform-preview-head"><div><strong>{p.title}</strong></div><em>{p.metric}</em></div>
  <div className="bos-platform-preview-grid">{p.rows.map(r=><div key={r[0]}><strong>{r[0]}</strong><small>{r[1]}</small><i>→</i></div>)}</div>
  <footer><span>LICENCJA DOŻYWOTNIA</span><span>AKTUALIZACJE W APLIKACJI</span></footer>
 </div>;
}
