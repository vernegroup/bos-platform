import "../styles.css";

type PurchaseHeaderProps = {
  product: string;
};

export default function PurchaseHeader({
  product,
}: PurchaseHeaderProps) {
  return (
    <section className="bos-header">

      <div className="bos-header-left">

        <div className="bos-order">
        </div>

        <h1 className="bos-title">
          Twój produkt {product} jest gotowy do pobrania.
          <br />
        </h1>

      </div>

      <div className="bos-license">

        <div className="bos-license-label">
        </div>

        <div className="bos-license-name">
        </div>

      </div>

    </section>
  );
}