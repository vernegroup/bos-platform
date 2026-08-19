import { ReactNode } from "react";
import "../styles.css";

type ExecutivePaperProps = {
  children: ReactNode;
};

export default function ExecutivePaper({
  children,
}: ExecutivePaperProps) {
  return (
    <section className="bos-paper-wrapper">

      <div className="bos-paper">

        {children}

      </div>

    </section>
  );
}