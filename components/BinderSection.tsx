import BinderText from "./BinderText";
import BinderImage from "./BinderImage";

export default function BinderSection() {
  return (
    <section className="bos-binder-section">
      <div className="bos-page-width">
        <div className="bos-binder-grid">
          <BinderText />
          <BinderImage />
        </div>
      </div>
    </section>
  );
}