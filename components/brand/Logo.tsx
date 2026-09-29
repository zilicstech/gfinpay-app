import Image from "next/image";
import Link from "next/link";

export function Logo({
  light = false,
  compact = false,
  height: heightProp,
}: {
  light?: boolean;
  compact?: boolean;
  height?: number;
}) {
  const height = heightProp ?? (compact ? 48 : 68);
  const width = heightProp ? Math.round(height * 2.55) : compact ? 200 : 220;
  return (
    <Link
      href="/"
      className="relative inline-block shrink-0 overflow-hidden"
      style={{ height, width }}
      aria-label="gfinpay home"
    >
      <Image
        src="/images/gfinpay-transparent.png"
        alt="gfinpay"
        width={800}
        height={800}
        className={`absolute top-1/2 max-w-none -translate-y-1/2 ${
          heightProp ? "left-0 -translate-x-[8%]" : "left-1/2 -translate-x-1/2"
        } ${light ? "invert" : ""}`}
        style={{ height: height * (heightProp ? 3.15 : 2.8), width: "auto" }}
        priority
      />
    </Link>
  );
}
