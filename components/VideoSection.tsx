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
              BOS Manager Workbook
            </div>

            <div className="bos-video-description">
              Interaktywny arkusz Excel umożliwiający planowanie,
              monitorowanie oraz dokumentowanie procesu wdrożenia
              pracownika.
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
              Executive Documentation
            </div>

            <div className="bos-video-description">
              Przegląd kompletnego pakietu dokumentów BOS gotowych
              do natychmiastowego wykorzystania w procesie
              wdrażania pracowników.
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
              Real Implementation Workflow
            </div>

            <div className="bos-video-description">
              Zobacz, jak dokumentacja BOS oraz arkusz Manager
              współpracują podczas rzeczywistego procesu
              wdrażania pracownika.
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}