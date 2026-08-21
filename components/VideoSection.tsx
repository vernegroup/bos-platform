export default function VideoSection() {
  return (
    <section className="bos-video-section">

      <div className="bos-page-width">

        <div className="bos-video-grid">

          <div className="bos-video-card">

            <video
              className="bos-video"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="/videos/onboarding-01.mp4"
                type="video/mp4"
              />
            </video>

            <div className="bos-video-title">
              Pierwszy dzień pracownika
            </div>

            <div className="bos-video-description">
              Zobacz jak wygląda uporządkowany proces wdrożenia
              od pierwszych minut pracy.
            </div>

          </div>

          <div className="bos-video-card">

            <video
              className="bos-video"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="/videos/onboarding-02.mp4"
                type="video/mp4"
              />
            </video>

            <div className="bos-video-title">
              Formularze w praktyce
            </div>

            <div className="bos-video-description">
              Przykład wykorzystania checklist, instrukcji
              oraz dokumentacji operacyjnej.
            </div>

          </div>

          <div className="bos-video-card">

            <video
              className="bos-video"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="/videos/onboarding-03.mp4"
                type="video/mp4"
              />
            </video>

            <div className="bos-video-title">
              Efekt wdrożenia
            </div>

            <div className="bos-video-description">
              Powtarzalny proces, mniejsza liczba błędów
              i szybsze osiąganie samodzielności.
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}