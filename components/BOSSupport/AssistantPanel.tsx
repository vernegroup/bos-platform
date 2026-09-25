"use client";

import TextChat from "./TextChat";

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
        <button className="bos-assistant-close" type="button" onClick={onClose} aria-label="Zamknij BOS Assistant">×</button>
      </header>
      <TextChat />
    </section>
  );
}
