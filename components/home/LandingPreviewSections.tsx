const questions = [
  ["Co otrzymuję po zakupie?", "Dostęp do wybranego modułu BOS w ramach licencji organizacji oraz możliwość prowadzenia procesów w aplikacji."],
  ["Czy płatność odnawia się automatycznie?", "Nie. Zakup licencji jest jednorazową płatnością za 12 miesięcy dostępu; nie uruchamia automatycznego abonamentu."],
  ["Czym różnią się Wdrożenia od Awansów?", "Wdrożenia porządkują przygotowanie nowego pracownika do samodzielnej pracy. Awanse pomagają ocenić gotowość do objęcia nowej roli."],
  ["Jak działa dodatkowa pojemność?", "Organizacja z aktywną licencją Wdrożeń lub Awansów może dokupić 10 dodatkowych miejsc na Standardy za jednorazowe 49,99 zł brutto."],
];
export default function LandingPreviewSections() {
 return <div className="bos-land03">
   <section id="demonstracja" className="bos-land03__demo" aria-labelledby="bos-land03-demo-title">
     <div className="bos-land03__eyebrow">BOS / W PRAKTYCE</div>
     <div className="bos-land03__heading"><h2 id="bos-land03-demo-title">Od wymagań do <em>decyzji.</em></h2><p>Nie kolejny formularz. Uporządkowany przebieg pracy, w którym wiadomo, co przygotować, co sprawdzić i kiedy zamknąć proces.</p></div>
     <div className="bos-land03__timeline">
       <article><span>01 / PRZYGOTUJ</span><h3>Ustal wymagania</h3><p>Wybierz Standard i określ, czego oczekujesz od pracownika na stanowisku.</p></article>
       <article><span>02 / PRZEPROWADŹ</span><h3>Sprawdź wykonanie</h3><p>Przeprowadź działania, uzupełnij informacje i udokumentuj postęp.</p></article>
       <article><span>03 / ZAMKNIJ</span><h3>Podejmij decyzję</h3><p>Zweryfikuj warunki gotowości i zachowaj wynik procesu.</p></article>
     </div>
     <p className="bos-land03__note">Podgląd przebiegu procesu. Autentyczne zrzuty ekranu aplikacji dodamy po zatwierdzeniu ich do publikacji.</p>
   </section>
   <section id="pytania" className="bos-land03__faq" aria-labelledby="bos-land03-faq-title">
     <div><span className="bos-land03__eyebrow">BOS / INFORMACJE</span><h2 id="bos-land03-faq-title">Przed podjęciem <em>decyzji.</em></h2><p>Najważniejsze informacje o działaniu i zakupie BOS.</p></div>
     <div className="bos-land03__questions">{questions.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
   </section>
   <section className="bos-land03__closing"><span>BOS / STANDARDY OPERACYJNE BIZNESU</span><h2>Proces pod kontrolą.<br/><em>Decyzja oparta na faktach.</em></h2><a href="#produkty">POZNAJ PRODUKTY <span aria-hidden="true">→</span></a></section>
 </div>;
}
