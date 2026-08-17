export default function Modules() {
  return (
    <section className="py-32">
      <div className="mx-auto w-[92%] max-w-7xl">
        <div className="mb-16">
          <span className="uppercase tracking-[0.25em] text-orange-500 font-bold">
            Platforma BOS
          </span>

          <h2 className="mt-5 text-5xl font-black">Dostępne moduły</h2>

          <p className="mt-6 max-w-3xl text-xl leading-9 text-white/70">
            Każdy moduł rozwiązuje konkretny problem organizacyjny. Możesz
            korzystać z nich niezależnie lub rozwijać swoją organizację poprzez
            kolejne standardy BOS.
          </p>
        </div>

        {/* ONBOARDING */}

        <div className="mb-28 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="grid lg:grid-cols-2">
            <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-white/30 text-2xl font-bold">
                Produkt / Film
              </span>
            </div>

            <div className="p-10">
              <span className="text-orange-500 font-bold uppercase tracking-[0.2em]">
                BOS ONBOARDING
              </span>

              <h3 className="mt-5 text-4xl font-bold">
                Standardy wdrażania pracowników
              </h3>

              <p className="mt-6 text-white/70 leading-8">
                Gotowy system dokumentów, checklist i procedur, który pozwala
                uporządkować proces wdrażania nowych osób.
              </p>

              <div className="mt-10 grid gap-4">
                <button className="rounded-xl bg-orange-500 py-4 font-bold hover:bg-orange-400 transition">
                  BOS Onboarding — 499 zł
                </button>

                <button className="rounded-xl border border-white/20 py-4 font-bold">
                  Membership — 199 zł / miesiąc
                </button>

                <button className="rounded-xl border border-white/20 py-4 font-bold">
                  Implementation — Kontakt
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMPLAINTS */}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="grid lg:grid-cols-2">
            <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="text-white/30 text-2xl font-bold">
                Produkt / Film
              </span>
            </div>

            <div className="p-10">
              <span className="text-orange-500 font-bold uppercase tracking-[0.2em]">
                BOS COMPLAINTS
              </span>

              <h3 className="mt-5 text-4xl font-bold">
                Standardy obsługi reklamacji
              </h3>

              <p className="mt-6 text-white/70 leading-8">
                Moduł przygotowywany.
              </p>

              <div className="mt-10">
                <button className="rounded-xl border border-white/20 py-4 px-8 font-bold">
                  W przygotowaniu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
