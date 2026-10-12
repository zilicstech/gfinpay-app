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
  const width = heightProp ? Math.round(height * 4.2) : compact ? 220 : 260;

  const scale = light ? 0.71 : 1;
  const multiplier = (heightProp ? 3.15 : 2.8) * scale;

  const content = (
    <Image
      src={light ? "/images/gfinpay-white-logo.jpg" : "/images/gfinpay-new-logo.jpg"}
      alt="Gfinpay"
      width={1920}
      height={1080}
      className={`absolute top-1/2 left-1/2 max-w-none -translate-y-1/2 -translate-x-1/2 ${
        light ? "mix-blend-screen" : "mix-blend-multiply"
      }`}
      style={{ height: height * multiplier, width: "auto" }}
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
