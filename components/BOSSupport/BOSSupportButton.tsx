"use client";

type BOSSupportButtonProps = { open: boolean; onToggle: () => void };

export default function BOSSupportButton({ open, onToggle }: BOSSupportButtonProps) {
  return (
    <button
      type="button"
      className="bos-support-button"
      onClick={onToggle}
      aria-label={open ? "Zamknij BOS Assistant" : "Otwórz BOS Assistant"}
      aria-expanded={open}
      aria-controls="bos-support-window"
      title={open ? "Zamknij BOS Assistant" : "Otwórz BOS Assistant"}
    >
      <svg className="bos-support-button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {open ? (
          <path d="M6.7 6.7a1 1 0 0 1 1.4 0L12 10.6l3.9-3.9a1 1 0 1 1 1.4 1.4L13.4 12l3.9 3.9a1 1 0 0 1-1.4 1.4L12 13.4l-3.9 3.9a1 1 0 0 1-1.4-1.4l3.9-3.9-3.9-3.9a1 1 0 0 1 0-1.4Z" />
        ) : (
          <path d="M5.5 4h13A3.5 3.5 0 0 1 22 7.5v7a3.5 3.5 0 0 1-3.5 3.5H11l-4.8 3.2A1.4 1.4 0 0 1 4 20v-2.3A3.5 3.5 0 0 1 2 14.5v-7A3.5 3.5 0 0 1 5.5 4Zm0 2A1.5 1.5 0 0 0 4 7.5v7A1.5 1.5 0 0 0 5.5 16H6v2.1l4.4-2.9A1 1 0 0 1 11 15h7.5a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18.5 6h-13Z" />
        )}
      </svg>
      <span className="bos-support-button-label">BOS</span>
    </button>
  );
}
