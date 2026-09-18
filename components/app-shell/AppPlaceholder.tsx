type AppPlaceholderProps = {
  kicker: string;
  title: string;
  description: string;
  scope: string[];
};

export default function AppPlaceholder({
  kicker,
  title,
  description,
  scope,
}: AppPlaceholderProps) {
  return (
    <>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">{kicker}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="bos-app-build-state">
          <span>STATUS</span>
          <strong>MIEJSCE W ARCHITEKTURZE</strong>
        </div>
      </section>

      <section className="bos-route-placeholder" aria-label={`Zakres sekcji ${title}`}>
        <div className="bos-route-placeholder-head">
          <span>ZAKRES DOCELOWY</span>
          <strong>Funkcje zostaną wdrożone w kolejnych etapach</strong>
        </div>

        <div className="bos-route-placeholder-list">
          {scope.map((item, index) => (
            <div className="bos-route-placeholder-row" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
