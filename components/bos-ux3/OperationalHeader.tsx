import type { ReactNode } from "react";
export default function OperationalHeader({title,subtitle,status,children}:{title:string;subtitle?:string;status?:string;children?:ReactNode}) {
  return <header className="bos-ux3-header"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{status&&<span className="bos-ux3-header__status">{status}</span>}{children}</header>;
}
