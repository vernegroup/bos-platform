import type { ReactNode } from "react";
export default function AuditDetails({children,label="Szczegóły potwierdzeń i historia"}:{children:ReactNode;label?:string}) {
  return <details className="bos-ux3-audit"><summary>{label}</summary><div className="bos-ux3-audit__content">{children}</div></details>;
}
