import ImplementationCard from "./ImplementationCard";

export default function BinderImage() {
  return (
    <div className="bos-binder-image">

      <img
        src="/images/binder.jpg"
        alt="Business Operating Standards Binder"
        className="bos-binder-photo"
      />

      <ImplementationCard />

    </div>
  );
}