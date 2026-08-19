import { ReactNode } from "react";

type PaperProps = {
  children: ReactNode;
};

export default function Paper({ children }: PaperProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "680px",
        margin: "0 auto",
        background: "#fcfcfb",
        borderRadius: "18px",
        padding: "54px",
        boxShadow:
          "0 30px 80px rgba(7,18,34,.08), 0 10px 24px rgba(7,18,34,.05)",
        position: "relative",
        animation: "bosFloat 8s ease-in-out infinite",
      }}
    >
      {children}
    </div>
  );
}