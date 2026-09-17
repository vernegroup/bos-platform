"use client";

import { useState } from "react";

import "./BOSSupport.css";

export default function BOSSupport() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="bos-support-window">

          <div className="bos-support-header">
            BOS Support
          </div>

          <div className="bos-support-content">

            <div className="bos-support-title">
              Dzień dobry 👋
            </div>

            <div className="bos-support-text">
              W czym możemy pomóc?
            </div>

            <div className="bos-support-options">

              <button className="bos-support-option">
                Dobór produktu
              </button>

              <button className="bos-support-option">
                Pytanie po zakupie
              </button>

              <button className="bos-support-option">
                Wdrożenie
              </button>

              <button className="bos-support-option">
                Inne
              </button>

            </div>

            <textarea
              className="bos-support-message"
              placeholder="Opisz krótko swoje pytanie..."
            />

            <button
              className="bos-support-send"
              type="button"
            >
              Wyślij wiadomość
            </button>

          </div>

        </div>
      )}

      <div className="bos-support-widget">

        <button
          type="button"
          className="bos-support-button"
          onClick={() => setOpen(!open)}
        >
          💬
        </button>

      </div>
    </>
  );
}