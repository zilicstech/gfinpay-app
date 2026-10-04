import Image from "next/image";
import Link from "next/link";

export function Logo({
  light = false,
  compact = false,
  height: heightProp,
  href = "/",
  asSpan = false,
}: {
  light?: boolean;
  compact?: boolean;
  height?: number;
  href?: string | null;
  asSpan?: boolean;
}) {
  const height = heightProp ?? (compact ? 48 : 68);
  const width = heightProp ? Math.round(height * 2.55) : compact ? 200 : 220;

  const content = (
    <Image
      src="/images/gfinpay-transparent.png"
      alt="Gfinpay"
      width={800}
      height={800}
      className={`absolute top-1/2 max-w-none -translate-y-1/2 ${
        heightProp ? "left-0 -translate-x-[8%]" : "left-1/2 -translate-x-1/2"
      } ${light ? "invert" : ""}`}
      style={{ height: height * (heightProp ? 3.15 : 2.8), width: "auto" }}
      priority
    />
  );

  const className = "relative inline-block shrink-0 overflow-hidden";
  const style = { height, width };

  if (asSpan || href === null) {
    return (
      <span className={className} style={style} aria-label="Gfinpay">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      style={style}
      aria-label="Gfinpay home"
    >
      {content}
    </Link>
  );
}
