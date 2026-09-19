"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type AppShellProps = {
  children: React.ReactNode;
  account: { name: string; email: string; image: string | null };
  organizationName: string;
};

type IconName = "home"|"products"|"users"|"company"|"search"|"updates"|"settings"|"help"|"logout"|"bell"|"chevron";

const navigation:{label:string;href:string;icon:IconName}[] = [
  { label:"Strona główna", href:"/app", icon:"home" },
  { label:"Produkty", href:"/app/products", icon:"products" },
  { label:"Użytkownicy", href:"/app/users", icon:"users" },
  { label:"Firma", href:"/app/organization", icon:"company" },
  { label:"Wyszukiwarka", href:"/app/search", icon:"search" },
  { label:"Aktualizacje", href:"/app/updates", icon:"updates" },
  { label:"Ustawienia", href:"/app/settings", icon:"settings" },
];

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
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function isCurrentPath(pathname:string,href:string){return href==="/app"?pathname===href:pathname===href||pathname.startsWith(href+"/");}
function initials(name:string){return name.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]?.toUpperCase()).join("")||"B";}
function firstName(name:string){return name.trim().split(/\s+/)[0]||name;}

export default function AppShell({children,account,organizationName}:AppShellProps){
  const pathname=usePathname();
  const [mobileOpen,setMobileOpen]=useState(false);
  const sidebarRef=useRef<HTMLElement>(null);
  const closeButtonRef=useRef<HTMLButtonElement>(null);
  const menuButtonRef=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(!mobileOpen)return;
    const previous=document.body.style.overflow; document.body.style.overflow="hidden"; closeButtonRef.current?.focus();
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMobileOpen(false);requestAnimationFrame(()=>menuButtonRef.current?.focus());}};
    document.addEventListener("keydown",onKey); return()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",onKey);};
  },[mobileOpen]);

  return <div className="bos-app-shell">
    <a className="bos-skip-link" href="#bos-main-content">Przejdź do treści</a>
    <aside ref={sidebarRef} id="bos-app-navigation" className={"bos-app-sidebar"+(mobileOpen?" is-open":"")} aria-label="Menu aplikacji">
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
        <Link className="bos-app-search" href="/app/search"><Icon name="search"/><span>Szukaj w BOS...</span></Link>
        <div className="bos-app-topbar-actions">
          <Link href="/app/updates" className="bos-app-notifications" aria-label="Aktualizacje i powiadomienia"><Icon name="bell"/><span aria-hidden="true"/></Link>
          <div className="bos-app-account-mark" aria-hidden="true">{initials(account.name)}</div>
          <div className="bos-app-account-copy"><strong>{account.name}</strong><span>{organizationName}</span></div>
          <button className="bos-app-account-menu" type="button" aria-label={"Menu konta "+firstName(account.name)}><Icon name="chevron"/></button>
        </div>
      </header>
      <main id="bos-main-content" className="bos-app-workspace" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
