// FIX-02: the approved HOME 2.0 uses a static wallpaper in CSS.
// Legacy procedural beams are display:none; do not install scroll/pointer
// animation listeners or run requestAnimationFrame for invisible layers.
export default function PublicScene() {
  return <div className="bos-public-scene" aria-hidden="true" />;
}
