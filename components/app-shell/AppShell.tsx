"use client";

// PANEL-03: functional client header

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import AppProductRail from "./AppProductRail";

type AppShellProps = {
  children: React.ReactNode;
  account: { name: string; email: string; image: string | null; role: string };
  organizationName: string;
};

type IconName = "home"|"products"|"users"|"company"|"search"|"updates"|"settings"|"help"|"logout"|"bell"|"chevron"|"chat";

const navigation:{label:string;href:string;icon:IconName}[] = [
  { label:"Strona główna", href:"/app", icon:"home" },
  { label:"Produkty", href:"/app/products", icon:"products" },
  { label:"Użytkownicy", href:"/app/users", icon:"users" },
  { label:"Firma", href:"/app/organization", icon:"company" },
  { label:"Wyszukiwarka", href:"/app/search", icon:"search" },
  { label:"Aktualizacje", href:"/app/updates", icon:"updates" },
  { label:"Ustawienia", href:"/app/settings", icon:"settings" },
];
const roleLabels:Record<string,string>={OWNER:"Właściciel",ADMIN:"Administrator",MANAGER:"Manager",USER:"Użytkownik"};

function Icon({name}:{name:IconName}) {
  const common={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};
  const paths:Record<IconName,React.ReactNode>={
    home:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/></>,
    products:<><path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="m4 8v8l8 4 8-4V8"/><path d="M12 12v8"/></>,
    users:<><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.5-3.4 2.4-5 5.5-5s5 1.6 5.5 5"/><path d="M16 5.5a3 3 0 0 1 0 5.5M16.5 14c2.3.4 3.7 2 4 5"/></>,
    company:<><path d="M4 20V8l8-4 8 4v12"/><path d="M8 20v-5h8v5M8 9h.01M12 9h.01M16 9h.01"/></>,
    search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
    updates:<><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/><path d="M7 4.8 5 4v2"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2.3-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2.3h3l.7-2.3 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7 2-.7Z" transform="scale(.75) translate(4 4)"/></>,
    help:<><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.3 2.2c-.8.4-1.1.9-1.1 1.8"/><path d="M12 17h.01"/></>,
    logout:<><path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M18 12H9"/></>,
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 20h4"/></>,
    chevron:<path d="m8 10 4 4 4-4"/>,
    chat:<><path d="M5 18.5 3.5 21l3.8-1.3A9 9 0 1 0 5 18.5Z"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function isCurrentPath(pathname:string,href:string){return href==="/app"?pathname===href:pathname===href||pathname.startsWith(href+"/");}
function initials(name:string){return name.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]?.toUpperCase()).join("")||"B";}

export default function AppShell({children,account,organizationName}:AppShellProps){
  const pathname=usePathname();
  const router=useRouter();
  const [mobileOpen,setMobileOpen]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const [search,setSearch]=useState("");
  const closeButtonRef=useRef<HTMLButtonElement>(null);
  const menuButtonRef=useRef<HTMLButtonElement>(null);
  const accountRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    if(!mobileOpen)return;
    const previous=document.body.style.overflow; document.body.style.overflow="hidden"; closeButtonRef.current?.focus();
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMobileOpen(false);requestAnimationFrame(()=>menuButtonRef.current?.focus());}};
    document.addEventListener("keydown",onKey); return()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",onKey);};
  },[mobileOpen]);

  useEffect(()=>{
    const close=(event:MouseEvent)=>{if(accountRef.current&&!accountRef.current.contains(event.target as Node))setAccountOpen(false);};
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")setAccountOpen(false);};
    document.addEventListener("mousedown",close);document.addEventListener("keydown",key);
    return()=>{document.removeEventListener("mousedown",close);document.removeEventListener("keydown",key);};
  },[]);

  function submitSearch(event:FormEvent<HTMLFormElement>){event.preventDefault();const q=search.trim();router.push(q?"/app/search?q="+encodeURIComponent(q):"/app/search");}

  return <div className="bos-app-shell">
    <a className="bos-skip-link" href="#bos-main-content">Przejdź do treści</a>
    <aside id="bos-app-navigation" className={"bos-app-sidebar"+(mobileOpen?" is-open":"")} aria-label="Menu aplikacji">
      <div className="bos-app-sidebar-head">
        <Link href="/app" className="bos-app-brand" aria-label="BOS — panel główny" onClick={()=>setMobileOpen(false)}><span>BOS</span></Link>
        <button ref={closeButtonRef} className="bos-app-sidebar-close" type="button" aria-label="Zamknij menu" onClick={()=>setMobileOpen(false)}>×</button>
      </div>
      <nav className="bos-app-nav" aria-label="Nawigacja aplikacji BOS">
        {navigation.map(item=><Link key={item.href} href={item.href} className={"bos-app-nav-link"+(isCurrentPath(pathname,item.href)?" is-active":"")} aria-current={isCurrentPath(pathname,item.href)?"page":undefined} onClick={()=>setMobileOpen(false)}><Icon name={item.icon}/><span>{item.label}</span></Link>)}
      </nav>
      <div className="bos-app-sidebar-bottom">
        <Link href="/app/help" className={"bos-app-nav-link"+(isCurrentPath(pathname,"/app/help")?" is-active":"")} aria-current={isCurrentPath(pathname,"/app/help")?"page":undefined} onClick={()=>setMobileOpen(false)}><Icon name="help"/><span>Pomoc</span></Link>
        <Link href="/api/auth/signout" className="bos-app-nav-link"><Icon name="logout"/><span>Wyloguj</span></Link>
      </div>
    </aside>
    {mobileOpen&&<button className="bos-app-scrim" aria-label="Zamknij menu" onClick={()=>setMobileOpen(false)}/>}
    <div className="bos-app-main">
      <header className="bos-app-topbar">
        <button ref={menuButtonRef} className="bos-app-menu-button" type="button" aria-label="Otwórz menu" aria-controls="bos-app-navigation" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(true)}><span/><span/><span/></button>
        <form className="bos-app-search" role="search" onSubmit={submitSearch}>
          <Icon name="search"/><input value={search} onChange={e=>setSearch(e.target.value)} aria-label="Szukaj w BOS" placeholder="Szukaj w BOS..." />
        </form>
        <div className="bos-app-topbar-actions">
          <Link href="/app/updates" className="bos-app-notifications" aria-label="Aktualizacje"><Icon name="bell"/></Link>
          <div className="bos-app-account" ref={accountRef}>
            <button className="bos-app-account-trigger" type="button" aria-expanded={accountOpen} aria-haspopup="menu" onClick={()=>setAccountOpen(v=>!v)}>
              <span className="bos-app-account-mark" aria-hidden="true">{initials(account.name)}</span>
              <span className="bos-app-account-copy"><strong>{account.name}</strong><span>{roleLabels[account.role]??account.role}</span></span>
              <span className="bos-app-account-chevron"><Icon name="chevron"/></span>
            </button>
            {accountOpen&&<div className="bos-app-account-dropdown">
              <div className="bos-app-account-context"><strong>{account.name}</strong><span>{account.email}</span><small>{organizationName}</small></div>
              <Link href="/app/settings" onClick={()=>setAccountOpen(false)}>Ustawienia konta</Link>
              <Link href="/app/organization" onClick={()=>setAccountOpen(false)}>Firma</Link>
              <Link href="/app/help" onClick={()=>setAccountOpen(false)}>Pomoc</Link>
              <div className="bos-app-account-divider"/>
              <Link href="/api/auth/signout">Wyloguj</Link>
            </div>}
          </div>
        </div>
      </header>
      <AppProductRail />
      <main id="bos-main-content" className="bos-app-workspace" tabIndex={-1}>{children}</main>
      <Link href="/app/help" className="bos-app-chat-fab" aria-label="Otwórz pomoc BOS" title="Pomoc BOS"><Icon name="chat"/></Link>
    </div>
  </div>;
}
