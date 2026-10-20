import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Strona w budowie | BOS — Standardy Operacyjne Biznesu",
  description: "Pracujemy nad nową odsłoną BOS — Standardów Operacyjnych Biznesu.",
  robots: { index: false, follow: false },
};

export default function HomePage() {
  return (
    <main style={{minHeight:"100svh",display:"grid",placeItems:"center",padding:"32px 20px",background:"#0b2038",color:"#cfaa69",fontFamily:"var(--font-body), Arial, sans-serif"}}>
      <section style={{width:"100%",maxWidth:780,textAlign:"center",padding:"clamp(32px,7vw,80px) 16px",borderTop:"1px solid rgba(207,170,105,.45)",borderBottom:"1px solid rgba(207,170,105,.45)"}} aria-labelledby="construction-title">
        <p style={{color:"#cfaa69",fontSize:"clamp(22px,4vw,34px)",fontWeight:750,letterSpacing:".22em",marginBottom:12}}>BOS</p>
        <p style={{color:"#cfaa69",fontSize:"clamp(10px,1.8vw,13px)",fontWeight:600,letterSpacing:".16em",textTransform:"uppercase",lineHeight:1.7,marginBottom:48}}>STANDARDY OPERACYJNE BIZNESU</p>
        <h1 id="construction-title" style={{color:"#cfaa69",fontFamily:"var(--font-heading), Georgia, serif",fontSize:"clamp(42px,8vw,76px)",fontWeight:600,lineHeight:1.1,marginBottom:22}}>Strona w budowie</h1>
        <p style={{color:"#eee8dc",fontSize:"clamp(15px,2vw,19px)",lineHeight:1.7,maxWidth:520,margin:"0 auto"}}>Pracujemy nad nową odsłoną platformy BOS. Dziękujemy za cierpliwość.</p>
      </section>
    </main>
  );
}
