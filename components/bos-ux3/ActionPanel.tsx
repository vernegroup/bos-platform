import type { ReactNode } from "react";
export default function ActionPanel({title,description,context,children}:{title:string;description?:string;context?:ReactNode;children:ReactNode}) {
  return <section className="bos-ux3-action" aria-label={title}>
    <div className="bos-ux3-action__body"><h3>{title}</h3>{description&&<p>{description}</p>}{context}</div>
    <div className="bos-ux3-action__controls">{children}</div>
  </section>;
}
