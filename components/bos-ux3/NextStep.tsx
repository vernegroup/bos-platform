import type { ReactNode } from "react";
export default function NextStep({title="Co dalej?",description,children}:{title?:string;description:string;children?:ReactNode}) {
  return <aside className="bos-ux3-next" aria-label={title}><strong>{title}</strong><p>{description}</p>{children}</aside>;
}
