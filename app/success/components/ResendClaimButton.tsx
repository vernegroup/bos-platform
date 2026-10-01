"use client";

import { useState } from "react";

export default function ResendClaimButton({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    try {
      const response = await fetch("/api/commerce/resend-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) throw new Error("resend_failed");
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button className="bos-portal-button" type="button" onClick={resend} disabled={state === "sending" || state === "sent"}>
        {state === "sending" ? "WYSYŁANIE…" : state === "sent" ? "WIADOMOŚĆ WYSŁANA" : "WYŚLIJ LINK PONOWNIE"}
      </button>
      {state === "error" && <p className="bos-purchase-note">Nie udało się wysłać wiadomości. Odczekaj kilka minut i spróbuj ponownie.</p>}
    </div>
  );
}
