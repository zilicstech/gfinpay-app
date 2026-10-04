/**
 * Hero illustration: a kirana shop owner selling every gfinpay service from a laptop.
 * Pure SVG (no raster assets) so it stays crisp on every screen size.
 */

type IconKind = "transfer" | "bill" | "aadhaar" | "recharge" | "upi" | "fastag" | "card" | "lic";

const SERVICES: { label: string; color: string; icon: IconKind }[] = [
  { label: "Money Transfer", color: "#10B981", icon: "transfer" },
  { label: "Bill Pay", color: "#F59E0B", icon: "bill" },
  { label: "Aadhaar ATM", color: "#6366F1", icon: "aadhaar" },
  { label: "Recharge", color: "#0EA5E9", icon: "recharge" },
  { label: "UPI Cash Out", color: "#8B5CF6", icon: "upi" },
  { label: "FASTag", color: "#F97316", icon: "fastag" },
  { label: "FD Credit Card", color: "#0F172A", icon: "card" },
  { label: "LIC Premium", color: "#E11D48", icon: "lic" },
];

const PRODUCT_COLORS = ["#F87171", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA", "#FB923C"];
const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";

function ServiceIcon({ kind, cx, cy, color }: { kind: IconKind; cx: number; cy: number; color: string }) {
  const s = { stroke: "#fff", strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "transfer":
      return (
        <g {...s}>
          <path d={`M${cx - 6} ${cy - 3} H${cx + 6} M${cx + 3} ${cy - 6} L${cx + 6} ${cy - 3} L${cx + 3} ${cy}`} />
          <path d={`M${cx + 6} ${cy + 3} H${cx - 6} M${cx - 3} ${cy} L${cx - 6} ${cy + 3} L${cx - 3} ${cy + 6}`} />
        </g>
      );
    case "bill":
      return (
        <polygon
          fill="#fff"
          points={`${cx + 1},${cy - 7} ${cx - 5},${cy + 1} ${cx - 1},${cy + 1} ${cx - 2},${cy + 7} ${cx + 5},${cy - 1} ${cx + 1},${cy - 1}`}
        />
      );
    case "aadhaar":
      return (
        <g {...s}>
          <path d={`M${cx - 5} ${cy + 6} Q${cx - 6} ${cy - 6} ${cx} ${cy - 6} Q${cx + 6} ${cy - 6} ${cx + 5} ${cy + 6}`} />
          <path d={`M${cx - 2} ${cy + 6} Q${cx - 3} ${cy - 2} ${cx} ${cy - 2} Q${cx + 3} ${cy - 2} ${cx + 2} ${cy + 6}`} />
        </g>
      );
    case "recharge":
      return (
        <g {...s}>
          <rect x={cx - 4} y={cy - 7} width={8} height={14} rx={2} />
          <path d={`M${cx - 1} ${cy + 4} H${cx + 1}`} />
        </g>
      );
    case "upi":
      return (
        <g fill="#fff">
          <rect x={cx - 6} y={cy - 6} width={5} height={5} rx={1} />
          <rect x={cx + 1} y={cy - 6} width={5} height={5} rx={1} />
          <rect x={cx - 6} y={cy + 1} width={5} height={5} rx={1} />
          <rect x={cx + 2} y={cy + 2} width={3} height={3} />
        </g>
      );
    case "fastag":
      return (
        <g>
          <path d={`M${cx - 4} ${cy - 2} L${cx - 2} ${cy - 6} H${cx + 2} L${cx + 4} ${cy - 2} Z`} fill="#fff" />
          <rect x={cx - 7} y={cy - 2} width={14} height={6} rx={2} fill="#fff" />
          <circle cx={cx - 4} cy={cy + 4} r={1.8} fill={color} />
          <circle cx={cx + 4} cy={cy + 4} r={1.8} fill={color} />
        </g>
      );
    case "card":
      return (
        <g {...s}>
          <rect x={cx - 7} y={cy - 5} width={14} height={10} rx={2} />
          <path d={`M${cx - 7} ${cy - 1} H${cx + 7}`} />
        </g>
      );
    case "lic":
      return (
        <path
          fill="#fff"
          d={`M${cx} ${cy - 7} L${cx + 6} ${cy - 4} V${cy + 1} Q${cx + 6} ${cy + 6} ${cx} ${cy + 8} Q${cx - 6} ${cy + 6} ${cx - 6} ${cy + 1} V${cy - 4} Z`}
        />
      );
  }
}

function Shelf({ x, width }: { x: number; width: number }) {
  const rows = [196, 266, 336];
  return (
    <g>
      <rect x={x} y={118} width={width} height={276} rx={12} fill="#FFFFFF" opacity={0.7} />
      {rows.map((plankY, r) => (
        <g key={plankY}>
          {Array.from({ length: Math.floor((width - 16) / 28) }).map((_, i) => {
            const h = 34 + ((i * 7 + r * 5) % 14);
            return (
              <rect
                key={i}
                x={x + 12 + i * 28}
                y={plankY - h}
                width={22}
                height={h}
                rx={4}
                fill={PRODUCT_COLORS[(i + r * 2) % PRODUCT_COLORS.length]}
                opacity={0.85}
              />
            );
          })}
          <rect x={x} y={plankY} width={width} height={8} rx={3} fill="#D6B48A" />
        </g>
      ))}
    </g>
  );
}

export function HeroLaptopArt() {
  const tileW = 63;
  const tileH = 52;
  const gap = 8;
  const gridX = 402;
  const gridY = 252;

  return (
    <div className="pf-art relative w-full">
      <svg
        viewBox="0 0 800 560"
        className="block h-auto w-full"
        role="img"
        aria-label="A shop owner using the Gfinpay retailer desk on a laptop to offer money transfer, bill pay, Aadhaar ATM, recharge, UPI cash out, FASTag, FD credit cards and LIC premium"
        fontFamily={FONT}
      >
        <defs>
          <linearGradient id="hla-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ECFDF5" />
            <stop offset="55%" stopColor="#F0FDFA" />
            <stop offset="100%" stopColor="#EEF2FF" />
          </linearGradient>
          <linearGradient id="hla-brand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
          <linearGradient id="hla-kurta" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#115E59" />
          </linearGradient>
          <filter id="hla-shadow" x="-20%" y="-30%" width="140%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* Backdrop */}
        <rect width="800" height="560" fill="url(#hla-bg)" />
        <circle cx="690" cy="120" r="140" fill="#10B981" opacity="0.08" />
        <circle cx="90" cy="470" r="120" fill="#6366F1" opacity="0.06" />

        {/* Shelves with products */}
        <Shelf x={36} width={190} />
        <Shelf x={600} width={170} />

        {/* Shop sign + awning */}
        <rect x="250" y="16" width="300" height="50" rx="14" fill="#0F172A" />
        <text x="400" y="44" textAnchor="middle" fontSize="22" fontWeight="800" fill="#34D399">
          Gfinpay
        </text>
        <text x="400" y="59" textAnchor="middle" fontSize="8" fontWeight="600" letterSpacing="2" fill="#CBD5E1">
          DIGITAL BANKING POINT
        </text>
        {Array.from({ length: 16 }).map((_, i) => {
          const w = 47;
          const x = 24 + i * w;
          const fill = i % 2 === 0 ? "#10B981" : "#ECFDF5";
          return (
            <g key={i}>
              <rect x={x} y={72} width={w} height={26} fill={fill} />
              <path d={`M${x} 98 A${w / 2} ${w / 2.6} 0 0 0 ${x + w} 98 Z`} fill={fill} />
            </g>
          );
        })}

        {/* Shop owner (torso + head) */}
        <path d="M236 412 C236 342 260 306 310 300 C360 306 384 342 384 412 Z" fill="url(#hla-kurta)" />
        <path d="M296 302 L310 324 L324 302" stroke="#CCFBF1" strokeWidth="3" fill="none" strokeLinejoin="round" />
        <circle cx="310" cy="340" r="2.6" fill="#CCFBF1" />
        <circle cx="310" cy="356" r="2.6" fill="#CCFBF1" />
        <rect x="298" y="278" width="24" height="26" rx="8" fill="#B97A4F" />
        <circle cx="274" cy="254" r="7" fill="#B97A4F" />
        <circle cx="346" cy="254" r="7" fill="#B97A4F" />
        <circle cx="310" cy="250" r="36" fill="#C98B5E" />
        <path
          d="M273 246 C270 212 295 202 312 204 C335 204 351 218 347 246 C341 230 327 224 310 226 C293 226 281 234 273 246 Z"
          fill="#1F2937"
        />
        <circle cx="297" cy="252" r="3.2" fill="#1F2937" />
        <circle cx="323" cy="252" r="3.2" fill="#1F2937" />
        <path d="M297 268 Q310 261 323 268 Q310 273 297 268 Z" fill="#1F2937" />
        <path d="M302 277 Q310 283 318 277" stroke="#7C2D12" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Counter */}
        <rect x="16" y="396" width="768" height="16" rx="6" fill="#0F172A" />
        <rect x="24" y="410" width="752" height="150" fill="#FFFFFF" stroke="#E2E8F0" />
        <rect x="270" y="436" width="260" height="66" rx="16" fill="url(#hla-brand)" />
        <text x="400" y="466" textAnchor="middle" fontSize="22" fontWeight="800" fill="#FFFFFF">
          Gfinpay
        </text>
        <text x="400" y="487" textAnchor="middle" fontSize="9" fontWeight="600" fill="#D1FAE5">
          Money • Bills • Cash • Cards • Insurance
        </text>

        {/* Laptop */}
        <rect x="384" y="176" width="312" height="212" rx="12" fill="#0F172A" />
        <rect x="394" y="186" width="292" height="192" rx="6" fill="#FFFFFF" />
        <path d="M394 192 A6 6 0 0 1 400 186 H680 A6 6 0 0 1 686 192 V212 H394 Z" fill="#0F172A" />
        <text x="404" y="204" fontSize="12" fontWeight="800" fill="#34D399">
          Gfinpay
        </text>
        <circle className="pf-pulse" cx="598" cy="199" r="3" fill="#34D399" />
        <text x="604" y="202" fontSize="7" fontWeight="600" fill="#A7F3D0">
          Live
        </text>
        <text x="676" y="202" textAnchor="end" fontSize="8" fill="#CBD5E1">
          Retailer Desk
        </text>
        <text x="404" y="227" fontSize="7.5" fill="#64748B">
          Wallet Balance
        </text>
        <text x="404" y="244" fontSize="14" fontWeight="800" fill="#0F172A">
          ₹48,250.00
        </text>
        <rect x="626" y="222" width="50" height="18" rx="9" fill="#10B981" />
        <text x="651" y="234" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FFFFFF">
          + Load
        </text>
        {SERVICES.map((svc, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const tx = gridX + col * (tileW + gap);
          const ty = gridY + row * (tileH + gap);
          const cx = tx + tileW / 2;
          const cy = ty + 20;
          return (
            <g key={svc.label}>
              <rect x={tx} y={ty} width={tileW} height={tileH} rx={9} fill="#F8FAFC" stroke="#E2E8F0" />
              <circle cx={cx} cy={cy} r={12} fill={svc.color} />
              <ServiceIcon kind={svc.icon} cx={cx} cy={cy} color={svc.color} />
              <text x={cx} y={ty + 44} textAnchor="middle" fontSize="7" fontWeight="600" fill="#334155">
                {svc.label}
              </text>
            </g>
          );
        })}
        <path d="M360 388 H720 L708 404 H372 Z" fill="#CBD5E1" />
        <rect x="510" y="388" width="60" height="5" rx="2" fill="#94A3B8" />

        {/* Arms on counter / trackpad */}
        <path d="M262 322 C240 352 250 386 292 398" stroke="url(#hla-kurta)" strokeWidth="22" strokeLinecap="round" fill="none" />
        <circle cx="298" cy="399" r="10" fill="#C98B5E" />
        <path d="M358 322 C392 344 412 372 432 392" stroke="url(#hla-kurta)" strokeWidth="22" strokeLinecap="round" fill="none" />
        <circle cx="437" cy="395" r="10" fill="#C98B5E" />

        {/* Floating card: today's earnings */}
        <g className="pf-float-slow" style={{ transformBox: "fill-box", transformOrigin: "center" }} filter="url(#hla-shadow)">
          <rect x="36" y="150" width="172" height="94" rx="16" fill="#FFFFFF" />
          <text x="54" y="172" fontSize="9" fontWeight="600" fill="#64748B">
            Today&apos;s Earnings
          </text>
          <text x="54" y="194" fontSize="18" fontWeight="800" fill="#0F172A">
            ₹1,240
          </text>
          {[16, 24, 18, 30, 22, 34, 28].map((h, i) => (
            <rect key={i} x={54 + i * 20} y={232 - h} width={12} height={h} rx={3} fill="#10B981" opacity={0.35 + i * 0.09} />
          ))}
        </g>

        {/* Floating card: payment successful */}
        <g
          className="pf-float-slow"
          style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: "1.2s" }}
          filter="url(#hla-shadow)"
        >
          <rect x="420" y="112" width="206" height="54" rx="16" fill="#FFFFFF" />
          <circle cx="446" cy="139" r="14" fill="#D1FAE5" />
          <path d="M439 139 L444 144 L453 134" stroke="#059669" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="468" y="135" fontSize="11" fontWeight="700" fill="#0F172A">
            Payment Successful
          </text>
          <text x="468" y="151" fontSize="9" fill="#64748B">
            ₹2,500 • IMPS • 4 sec
          </text>
        </g>

        {/* Floating card: commission earned */}
        <g
          className="pf-float-slow"
          style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: "2.2s" }}
          filter="url(#hla-shadow)"
        >
          <rect x="566" y="430" width="196" height="58" rx="16" fill="#FFFFFF" />
          <circle cx="594" cy="459" r="15" fill="#FEF3C7" />
          <text x="594" y="464" textAnchor="middle" fontSize="14" fontWeight="800" fill="#B45309">
            ₹
          </text>
          <text x="618" y="455" fontSize="11" fontWeight="800" fill="#047857">
            +₹45 Commission
          </text>
          <text x="618" y="471" fontSize="9" fill="#64748B">
            Credited to your wallet
          </text>
        </g>
      </svg>
    </div>
  );
}
