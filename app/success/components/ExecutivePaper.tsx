import { ReactNode } from "react";
import "../styles.css";

type ExecutivePaperProps = {
  children: ReactNode;
};

export default function ExecutivePaper({
  children,
}: ExecutivePaperProps) {
  return (
    <main className="bos-success-page">
      <div className="bos-page-width">
        <div className="bos-paper">
          {children}
        </div>
      </div>
    </main>
  );
}