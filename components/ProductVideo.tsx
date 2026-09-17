"use client";

import { useEffect, useRef, useState } from "react";

type ProductVideoProps = {
  src: string;
  label: string;
};

export default function ProductVideo({
  src,
  label,
}: ProductVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  async function handleMouseEnter() {
    const video = videoRef.current;

    if (!video) return;

    try {
      video.currentTime = 0;
      await video.play();
    } catch (error) {
      console.error("BOS VIDEO: play failed", error);
    }
  }

  function handleMouseLeave() {
    const video = videoRef.current;

    if (!video) return;

    video.pause();
    video.currentTime = 0;
  }

  function handleEnded() {
    const video = videoRef.current;

    if (!video) return;

    video.pause();
    video.currentTime = 0;
  }

  function openModal() {
    const video = videoRef.current;

    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    setIsOpen(true);
  }

  function closeModal() {
    const modalVideo = modalVideoRef.current;

    if (modalVideo) {
      modalVideo.pause();
      modalVideo.currentTime = 0;
    }

    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div
        className="bos-product-video-wrap"
        onClick={openModal}
        role="button"
        tabIndex={0}
        aria-label={`Otwórz podgląd: ${label}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openModal();
          }
        }}
      >
        <video
          ref={videoRef}
          className="bos-product-video"
          muted
          playsInline
          preload="auto"
          aria-label={label}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onEnded={handleEnded}
        >
          <source src={src} type="video/mp4" />
        </video>

        <div className="bos-product-video-hint">
          PODGLĄD
        </div>
      </div>

      {isOpen && (
        <div
          className="bos-video-modal"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <div
            className="bos-video-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="bos-video-modal-close"
              onClick={closeModal}
              aria-label="Zamknij podgląd"
            >
              ×
            </button>

            <video
              ref={modalVideoRef}
              className="bos-video-modal-player"
              controls
              autoPlay
              playsInline
            >
              <source src={src} type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </>
  );
}