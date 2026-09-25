"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import MicrophoneControl from "./MicrophoneControl";

export type TextChatMessage = { id: string; role: "assistant" | "user"; content: string };

const START_MESSAGE: TextChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Napisz, czego potrzebujesz. Na tym etapie testujemy lokalny przebieg rozmowy; silnik AI zostanie podłączony w kolejnych zadaniach.",
};
const LOCAL_REPLY = "Wiadomość została dodana do lokalnej sesji testowej. Po podłączeniu silnika AI w tym miejscu pojawi się właściwa odpowiedź BOS Assistant.";

type TextChatProps = { onFirstMessage?: () => void };

export default function TextChat({ onFirstMessage }: TextChatProps) {
  const [messages, setMessages] = useState<TextChatMessage[]>([START_MESSAGE]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const firstMessageSent = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages]);

  function sendMessage(raw: string) {
    const content = raw.trim();
    if (!content) return;
    const stamp = Date.now();
    setMessages((current) => [...current,
      { id: `user-${stamp}`, role: "user", content },
      { id: `assistant-${stamp}`, role: "assistant", content: LOCAL_REPLY },
    ]);
    setDraft("");
    if (!firstMessageSent.current) { firstMessageSent.current = true; onFirstMessage?.(); }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); sendMessage(draft); }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(draft); }
  }

  return (
    <>
      <div className="bos-assistant-body" aria-live="polite" aria-relevant="additions">
        <div className="bos-text-chat-list">
          {messages.map((message) => (
            <div className={`bos-assistant-message bos-assistant-message-${message.role}`} key={message.id}>
              {message.role === "assistant" && <span className="bos-assistant-avatar" aria-hidden="true">B</span>}
              <p>{message.content}</p>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        {messages.length === 1 && (
          <div className="bos-assistant-suggestions" aria-label="Przykładowe pytania">
            <button type="button" onClick={() => sendMessage("Pomóż mi wybrać produkt")}>Pomóż mi wybrać produkt</button>
            <button type="button" onClick={() => sendMessage("Mam pytanie o wdrożenie")}>Mam pytanie o wdrożenie</button>
            <button type="button" onClick={() => sendMessage("Jak działa BOS?")}>Jak działa BOS?</button>
          </div>
        )}
      </div>

      <form className="bos-assistant-composer" onSubmit={handleSubmit}>
        <MicrophoneControl />
        <textarea
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Wiadomość do BOS Assistant"
          placeholder="Napisz wiadomość..."
        />
        <button className="bos-assistant-send" type="submit" aria-label="Wyślij wiadomość" disabled={!draft.trim()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.7 4.2 21 11.1a1 1 0 0 1 0 1.8L3.7 19.8a1 1 0 0 1-1.35-1.13l1.1-5.2L13 12 3.45 10.53l-1.1-5.2A1 1 0 0 1 3.7 4.2Z" /></svg>
        </button>
      </form>
    </>
  );
}
