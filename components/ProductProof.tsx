import ProductPlatformPreview from "./ProductPlatformPreview";
import type { BOSProduct } from "@/data/products";

export default function ProductProof({product}:{product:BOSProduct}){
 return <section className="bos-product-proof">
  <div className="bos-page-width bos-product-proof-grid">
   <div className="bos-product-proof-copy">
    <span className="bos-product-proof-kicker">RZECZYWISTY PRODUKT BOS WEB</span>
    <h2>{product.id==="onboarding"?"Od standardu stanowiska do zamkniętego wdrożenia.":"Od decyzji o zmianie roli do zweryfikowanego zamknięcia."}</h2>
    <p>{product.id==="onboarding"?"Pracujesz w aplikacji BOS: tworzysz wersjonowany Standard Stanowiska, uruchamiasz na nim konkretne wdrożenie pracownika, kontrolujesz wykonanie i zachowujesz wynik w historii.":"Promotions prowadzi awanse i przesunięcia poziome jako kontrolowany proces. Kryteria gotowości, przebieg zmiany i zamknięcie pozostają zapisane w organizacji."}</p>
    <div className="bos-product-proof-points"><span>ODDZIELNE KONTO FIRMY</span><span>DANE ORGANIZACJI</span><span>HISTORIA I WERSJE</span><span>BEZ SUBSKRYPCJI</span></div>
   </div>
   <ProductPlatformPreview product={product}/>
  </div>
 </section>;
}
