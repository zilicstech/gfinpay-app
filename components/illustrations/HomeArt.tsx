const files = {
  dmt: "/illustrations/service-dmt.png?v=3dt",
  aeps: "/illustrations/service-aeps.png?v=3dt",
  upi: "/illustrations/service-upi.png?v=3dt",
  wallet: "/illustrations/service-wallet.png?v=3dt",
  cards: "/illustrations/service-cards.png?v=3dt",
  network: "/illustrations/service-network.png?v=3dt",
  bbps: "/illustrations/service-bbps.png?v=ps2",
  recharge: "/illustrations/service-recharge.png?v=ps2",
  fastag: "/illustrations/service-fastag.png?v=ps2",
  lic: "/illustrations/service-lic.png?v=ps2",
} as const;

function Frame({
  src,
  label,
}: {
  src: string;
  label?: string;
}) {
  return (
    <div className="pf-art relative">
      <img
        src={src}
        alt={label ?? ""}
        className="pf-float h-auto w-full select-none bg-transparent object-contain"
        draggable={false}
      />
    </div>
  );
}

export function HeroKirana() {
  return (
    <Frame
      src="/illustrations/hero-kirana.png?v=3dt"
      label="gfinpay digital services — bill payments, transfers, and financial products"
    />
  );
}

export function ServiceArt({ kind }: { kind: keyof typeof files }) {
  return <Frame src={files[kind]} />;
}

export function LedgerArt() {
  return <Frame src="/illustrations/service-ledger.png?v=3dt" label="Immutable ledger and day-end matching" />;
}
