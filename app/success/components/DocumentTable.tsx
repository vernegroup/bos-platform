"use client";

import "../styles.css";

type DocumentTableProps = {
  product: string;
  sessionId: string;
};

export default function DocumentTable({
  product,
  sessionId,
}: DocumentTableProps) {

  let fileName = "";

  switch (product) {
    case "BOS Promotions":
      fileName = "BOS Promotions.zip";
      break;

    case "BOS Pricing":
      fileName = "BOS Pricing.zip";
      break;

    default:
      fileName = "BOS Onboarding.zip";
      break;
  }

  async function handleDownload() {
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (!response.ok) {
        alert("Nie udało się pobrać produktu.");
        return;
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert("Wystąpił błąd podczas pobierania.");
    }
  }

  return (
    <section className="bos-documents">

      <div className="bos-document">

        <div className="bos-document-left">

          <div>

            <div className="bos-document-title">
              {fileName}
            </div>

            <div className="bos-document-description">
              Kompletny pakiet produktu gotowy do pobrania
            </div>

          </div>

        </div>

        <button
          className="bos-download"
          onClick={handleDownload}
        >
          POBIERZ PRODUKT
        </button>

      </div>

      <div className="bos-document-info">

        <p>
          Na adres e-mail podany podczas zakupu zostanie wysłane
          <strong> potwierdzenie zakupu</strong> oraz
          <strong> licencja użytkowania BOS</strong>.
        </p>

      </div>

    </section>
  );
}