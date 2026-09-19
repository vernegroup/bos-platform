import Image from "next/image";
import ImplementationCard from "./ImplementationCard";

export default function BinderImage() {
  return (
    <div className="bos-binder-image">

      <Image
        src="/images/binder.jpg"
        alt="Business Operating Standards Binder"
        className="bos-binder-photo"
        width={5760}
        height={3840}
        sizes="(max-width: 800px) 100vw, 50vw"
      />

      <ImplementationCard />

    </div>
  );
}
