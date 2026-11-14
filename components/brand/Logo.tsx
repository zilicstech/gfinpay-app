import { useId } from "react";
import Image from "next/image";
import Link from "next/link";

export function Logo({
  light = false,
  transparent = false,
  compact = false,
  height: heightProp,
  href = "/",
  asSpan = false,
}: {
  light?: boolean;
  transparent?: boolean;
  compact?: boolean;
  height?: number;
  href?: string | null;
  asSpan?: boolean;
}) {
  const rawId = useId();
  const filterId = `gfin-logo-dark-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const useTransparentAsset = light || transparent;
  const height = heightProp ?? (compact ? 46 : 58);
  const width = Math.round(height * 2.85);
  const renderedImgHeight = Math.round(height * 2.28);

  const content = (
    <>
      {light && (
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        >
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="1.8 0 -2.65 0 1.08  -0.85 0.65 0 0 1.02  1.0 0 -1.9 0.35 1.06  0 0 0 1 0"
              />
            </filter>
          </defs>
        </svg>
      )}
      <Image
        src={useTransparentAsset ? "/images/gfinlogo_new_tp.png" : "/images/gfinlogo_new_main.jpeg"}
        alt="Gfinpay"
        width={useTransparentAsset ? 577 : 1448}
        height={useTransparentAsset ? 433 : 1086}
        className={`absolute left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 ${
          useTransparentAsset ? "" : "mix-blend-multiply"
        }`}
        style={{
          top: "51.5%",
          height: renderedImgHeight,
          width: "auto",
          filter: light ? `url(#${filterId})` : undefined,
        }}
        priority
      />
    </>
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
