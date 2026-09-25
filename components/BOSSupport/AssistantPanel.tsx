"use client";

type AssistantPanelProps = {
  onClose: () => void;
};

export default function AssistantPanel({ onClose }: AssistantPanelProps) {
  return (
    <section
      className="bos-assistant-panel"
      id="bos-support-window"
      role="dialog"
      aria-modal="false"
      aria-labelledby="bos-assistant-title"
    >
      <header className="bos-assistant-header">
        <div>
          <span className="bos-assistant-eyebrow">BOS ASSISTANT</span>
          <h2 id="bos-assistant-title">Jak mogę pomóc?</h2>
        </div>
        <button
          className="bos-assistant-close"
          type="button"
          onClick={onClose}
          aria-label="Zamknij BOS Assistant"
        >
          ×
        </button>
      </header>

      <div className="bos-assistant-body">
        <div className="bos-assistant-message bos-assistant-message-system">
          <span className="bos-assistant-avatar" aria-hidden="true">B</span>
          <p>
            Napisz, czego potrzebujesz. Na tym etapie testujemy interfejs rozmowy;
            silnik AI zostanie podłączony w kolejnych zadaniach.
          </p>
        </div>

        <div className="bos-assistant-suggestions" aria-label="Przykładowe pytania">
          <button type="button">Pomóż mi wybrać produkt</button>
          <button type="button">Mam pytanie o wdrożenie</button>
          <button type="button">Jak działa BOS?</button>
        </div>
      </div>

      <footer className="bos-assistant-composer">
        <textarea
          rows={1}
          aria-label="Wiadomość do BOS Assistant"
          placeholder="Napisz wiadomość..."
        />
        <button className="bos-assistant-send" type="button" aria-label="Wyślij wiadomość" disabled>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.7 4.2 21 11.1a1 1 0 0 1 0 1.8L3.7 19.8a1 1 0 0 1-1.35-1.13l1.1-5.2L13 12 3.45 10.53l-1.1-5.2A1 1 0 0 1 3.7 4.2Z" />
          </svg>
        </button>
      </footer>
    </section>
  );
}
