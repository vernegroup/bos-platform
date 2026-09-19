"use client";

import { useEffect } from "react";

export default function BOSAppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="bos-system-state bos-system-error" role="alert">
      <span className="bos-system-state-kicker">BOS / BŁĄD</span>
      <h1>Nie udało się wczytać tego widoku</h1>
      <p>Dane nie zostały zmienione. Spróbuj ponownie; jeśli problem się powtarza, odśwież aplikację.</p>
      <button type="button" onClick={reset}>SPRÓBUJ PONOWNIE →</button>
      {error.digest ? <small>Identyfikator błędu: {error.digest}</small> : null}
    </section>
  );
}
