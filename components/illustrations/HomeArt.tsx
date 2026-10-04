const files = {
  dmt: "/illustrations/shop_dmt.jpg",
  aeps: "/illustrations/shop_aeps.jpg",
  upi: "/illustrations/shop_upi.jpg?v=upi2",
  wallet: "/illustrations/service-wallet.png?v=3dt",
  cards: "/illustrations/shop_cards.jpg?v=sbm1",
  network: "/illustrations/service-network.png?v=3dt",
  bbps: "/illustrations/shop_bbps.jpg",
  recharge: "/illustrations/shop_recharge.jpg?v=rc2",
  fastag: "/illustrations/shop_fastag.jpg",
  lic: "/illustrations/shop_lic.jpg",
} as const;

function Frame({
  src,
  label,
}: {
  src: string;
  label?: string;
}) {
  return (
    <div className="relative w-full h-full">
      <img
        src={src}
        alt={label ?? ""}
        className="h-full w-full select-none bg-transparent object-cover"
        draggable={false}
      />
    </div>
  );
}

export function HeroKirana() {
  return (
    <Frame
      src="/illustrations/hero-kirana.jpg?v=3dt"
      label="Gfinpay digital services — bill payments, transfers, and financial products"
    />
  );
}

export function ServiceArt({ kind }: { kind: keyof typeof files }) {
  return <Frame src={files[kind]} />;
}

export function LedgerArt() {
  return <Frame src="/illustrations/service-ledger.png?v=3dt" label="Immutable ledger and day-end matching" />;
}
