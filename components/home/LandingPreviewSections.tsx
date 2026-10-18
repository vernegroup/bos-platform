const questions = [
  ["Co otrzymuję po zakupie?", "Dostęp dla organizacji do wybranego modułu BOS: Wdrożenia lub Awanse. Możesz przygotowywać Standardy, prowadzić procesy pracowników, sprawdzać postęp i dokumentować ich zakończenie. Okres licencji i aktualizacji wynosi 12 miesięcy."],
  ["Czy płatność odnawia się automatycznie?", "Nie. Zakup licencji jest jednorazową płatnością za 12 miesięcy dostępu; nie uruchamia automatycznego abonamentu."],
  ["Czym różnią się Wdrożenia od Awansów?", "Wdrożenia prowadzą nowego pracownika od przygotowania stanowiska do weryfikacji samodzielności. Awanse porównują wymagania nowej roli z przygotowaniem obecnego pracownika, wskazują braki i porządkują przekazanie obowiązków."],
  ["Jak działa dodatkowa pojemność?", "Organizacja z aktywną licencją Wdrożeń lub Awansów może dokupić 10 dodatkowych miejsc na Standardy za jednorazowe 49,99 zł brutto."],
  ["Czy mogę kupić tylko jeden moduł?", "Tak. Wdrożenia i Awanse są odrębnymi produktami; wybierasz ten, którego potrzebuje organizacja."],
  ["Co otrzymuję po zakończeniu wdrożenia?", "Po sprawdzeniu warunków gotowości proces można zamknąć i zachować Kartę Zakończenia wraz z udokumentowanym przebiegiem."],
  ["Czy muszę przygotować Standard stanowiska?", "Przed rozpoczęciem procesu potrzebny jest Standard określający wymagania stanowiska. Możesz dostosować jego treść do swojej organizacji."],
];
export default function LandingPreviewSections() {
 return <div className="bos-land03">
   <section id="demonstracja" className="bos-land03__demo" aria-labelledby="bos-land03-demo-title">
     <div className="bos-land03__eyebrow">BOS / W PRAKTYCE</div>
     <div className="bos-land03__heading"><h2 id="bos-land03-demo-title">Od wymagań do <em>decyzji.</em></h2><p>Przykład wdrożenia pracownika magazynu: od przygotowania Standardu stanowiska, przez potwierdzanie czynności krytycznych, po ocenę gotowości do samodzielnej pracy.</p></div>
     <div className="bos-land03__timeline">
       <article><span>01 / PRZYGOTUJ</span><h3>Przygotuj stanowisko</h3><p>Określ wymagania magazyniera, zadania i czynności krytyczne oraz warunki rozpoczęcia wdrożenia.</p></article>
       <article><span>02 / PRZEPROWADŹ</span><h3>Potwierdź umiejętności</h3><p>Przeprowadź zadania wdrożeniowe, odnotuj wykonanie i sprawdź brakujące potwierdzenia.</p></article>
       <article><span>03 / ZAMKNIJ</span><h3>Zamknij wdrożenie</h3><p>Zweryfikuj kryteria samodzielności i zachowaj udokumentowany wynik w Karcie Zakończenia.</p></article>
     </div>
     <p className="bos-land03__note">Przykład opisowy, nie rzeczywisty proces klienta. Zrzuty ekranu aplikacji wymagają osobnego przygotowania.</p>
   </section>
   <section id="pytania" className="bos-land03__faq" aria-labelledby="bos-land03-faq-title">
     <div><span className="bos-land03__eyebrow">BOS / INFORMACJE</span><h2 id="bos-land03-faq-title">Przed podjęciem <em>decyzji.</em></h2><p>Najważniejsze informacje o działaniu i zakupie BOS.</p></div>
     <div className="bos-land03__questions">{questions.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
   </section>
   <section className="bos-land03__closing"><span>BOS / STANDARDY OPERACYJNE BIZNESU</span><h2>Proces pod kontrolą.<br/><em>Decyzja oparta na faktach.</em></h2><a href="#produkty">POZNAJ PRODUKTY <span aria-hidden="true">→</span></a></section>
 </div>;
}
