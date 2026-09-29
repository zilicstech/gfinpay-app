"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  Check,
  CreditCard,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import type { CatalogCategory } from "@/features/sales/CatalogView";

type Accent = "emerald" | "amber" | "sky" | "violet" | "teal" | "rose";

type Pitch = {
  title: string;
  promise: string;
  banks?: string;
  features: string[];
  accent: Accent;
};

const PITCH: Record<string, Pitch> = {
  CREDIT_CARD: {
    title: "Credit card",
    promise: "A regular credit card. Apply on your phone — the bank sets the limit.",
    banks: "You choose the bank on the application",
    accent: "emerald",
    features: [
      "Spend now, repay on the bank’s cycle",
      "Finish the application on your own phone",
      "The bank decides approval and the credit limit",
      "No card fee collected at the counter",
    ],
  },
  SBM_FD_ZET: {
    title: "SBM secured card",
    promise: "A card backed by your own fixed deposit with SBM Bank.",
    banks: "SBM Bank",
    accent: "amber",
    features: ["Your deposit sets the card limit", "The deposit stays with the bank", "Complete the journey on your phone"],
  },
  IOB_FD_ZET: {
    title: "IOB secured card",
    promise: "A card backed by your own fixed deposit with Indian Overseas Bank.",
    banks: "Indian Overseas Bank",
    accent: "amber",
    features: ["Your deposit sets the card limit", "The deposit stays with the bank", "Complete the journey on your phone"],
  },
  SBM_FD: {
    title: "SBM secured card",
    promise: "Build a credit limit from a fixed deposit in your name.",
    banks: "SBM Bank",
    accent: "amber",
    features: [
      "Useful when a regular credit card is hard to get",
      "The deposit stays in your name with the bank",
      "You complete the deposit on your phone",
      "The card limit follows the deposit",
    ],
  },
  DCB_FD_GROWMORE: {
    title: "DCB secured card",
    promise: "A DCB Bank card backed by your fixed deposit.",
    banks: "DCB Bank",
    accent: "amber",
    features: [
      "Fixed deposit backs the card limit",
      "You complete onboarding on your phone",
      "The deposit stays with the bank",
    ],
  },
  INSTANT_LOAN: {
    title: "Instant loan",
    promise: "A smaller loan with a quicker decision, paid to your account.",
    banks: "The lender is chosen on the application",
    accent: "violet",
    features: [
      "Meant for short personal needs",
      "The lender sets the amount and the rate",
      "Money is paid to your bank account",
      "You finish the form on your phone",
    ],
  },
  PERSONAL_LOAN: {
    title: "Personal loan",
    promise: "Borrow for household or personal expenses. No collateral at the counter.",
    banks: "Compare lenders on the application",
    accent: "sky",
    features: [
      "For household or personal expenses",
      "You complete the form on your phone",
      "The lender decides the amount",
      "Disbursement goes to your own account",
    ],
  },
  BUSINESS_LOAN: {
    title: "Business loan",
    promise: "Working capital for stock, equipment, or the shop.",
    banks: "The lender reviews the business on the application",
    accent: "teal",
    features: [
      "For shop stock, equipment, or working capital",
      "Share business details on your phone",
      "The lender decides the amount after review",
      "Funds are paid to the business account",
    ],
  },
  SAVINGS: {
    title: "Savings account",
    promise: "Open a savings account with a partner bank. The account stays with that bank.",
    banks: "Kotak 811, Airtel Payments Bank, Equitas",
    accent: "rose",
    features: [
      "A new savings account with a partner bank",
      "You complete KYC on your phone",
      "The account stays with the bank",
      "We help you start; the bank finishes onboarding",
    ],
  },
};

const ACCENT: Record<Accent, { wash: string; icon: string; chip: string; ring: string }> = {
  emerald: {
    wash: "from-emerald-400 via-emerald-200 to-white",
    icon: "bg-black text-emerald-300",
    chip: "bg-emerald-50 text-emerald-900",
    ring: "hover:border-emerald-300",
  },
  amber: {
    wash: "from-amber-300 via-amber-100 to-white",
    icon: "bg-amber-950 text-amber-200",
    chip: "bg-amber-50 text-amber-950",
    ring: "hover:border-amber-300",
  },
  sky: {
    wash: "from-sky-300 via-sky-100 to-white",
    icon: "bg-sky-950 text-sky-200",
    chip: "bg-sky-50 text-sky-950",
    ring: "hover:border-sky-300",
  },
  violet: {
    wash: "from-violet-300 via-violet-100 to-white",
    icon: "bg-violet-950 text-violet-200",
    chip: "bg-violet-50 text-violet-950",
    ring: "hover:border-violet-300",
  },
  teal: {
    wash: "from-teal-300 via-teal-100 to-white",
    icon: "bg-teal-950 text-teal-100",
    chip: "bg-teal-50 text-teal-950",
    ring: "hover:border-teal-300",
  },
  rose: {
    wash: "from-rose-300 via-rose-100 to-white",
    icon: "bg-rose-950 text-rose-100",
    chip: "bg-rose-50 text-rose-950",
    ring: "hover:border-rose-300",
  },
};

const CATEGORY_ACCENT: Record<string, Accent> = {
  CREDIT_CARD: "emerald",
  FD_CARD: "amber",
  INSTANT_LOAN: "violet",
  PERSONAL_LOAN: "sky",
  BUSINESS_LOAN: "teal",
  SAVINGS: "rose",
};

const CATEGORY_ICON: Record<string, ReactNode> = {
  CREDIT_CARD: <CreditCard className="h-5 w-5" />,
  FD_CARD: <Landmark className="h-5 w-5" />,
  INSTANT_LOAN: <Zap className="h-5 w-5" />,
  PERSONAL_LOAN: <Wallet className="h-5 w-5" />,
  BUSINESS_LOAN: <Building2 className="h-5 w-5" />,
  SAVINGS: <PiggyBank className="h-5 w-5" />,
};

export type FdBankFace = {
  bank: string;
  mark: string;
  powered: string;
  face: string;
  shine: string;
};

export const FD_CARD_FACE: Record<string, FdBankFace> = {
  SBM_FD_ZET: {
    bank: "SBM Bank",
    mark: "SBM",
    powered: "ZET",
    face: "from-[#063226] via-[#0f6b45] to-[#c9a227]",
    shine: "from-white/30",
  },
  IOB_FD_ZET: {
    bank: "Indian Overseas Bank",
    mark: "IOB",
    powered: "ZET",
    face: "from-[#071a33] via-[#1a4f8b] to-[#8ec5ff]",
    shine: "from-white/25",
  },
  SBM_FD: {
    bank: "SBM Bank",
    mark: "SBM",
    powered: "NOVU",
    face: "from-[#063226] via-[#0f6b45] to-[#c9a227]",
    shine: "from-white/30",
  },
  DCB_FD_GROWMORE: {
    bank: "DCB Bank",
    mark: "DCB",
    powered: "GrowMore",
    face: "from-[#3a0610] via-[#9f1239] to-[#fb7185]",
    shine: "from-white/25",
  },
};

const FD_BANKS: FdBankFace[] = [
  { ...FD_CARD_FACE.SBM_FD_ZET, powered: "ZET · NOVU" },
  FD_CARD_FACE.IOB_FD_ZET,
  FD_CARD_FACE.DCB_FD_GROWMORE,
];

export function FdBankCard({ card, action }: { card: FdBankFace; action?: ReactNode }) {
  return (
    <div className={`relative flex h-44 w-full flex-col overflow-hidden rounded-[1.35rem] bg-gradient-to-br p-4 text-white shadow-[0_22px_40px_-24px_rgba(0,0,0,0.65)] sm:h-48 sm:p-5 ${card.face}`}>
      <div className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br to-transparent blur-2xl sm:h-36 sm:w-36 ${card.shine}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 sm:text-[11px]">gfinpay</p>
          <p className="mt-0.5 font-display text-xl tracking-tight sm:mt-1 sm:text-2xl">{card.mark}</p>
        </div>
        <div className="grid h-8 w-10 shrink-0 place-items-center rounded-md bg-gradient-to-br from-amber-100 to-amber-400 shadow-inner sm:h-9 sm:w-12">
          <div className="h-4 w-6 rounded-sm border border-amber-700/30 bg-amber-200/40 sm:h-5 sm:w-7" />
        </div>
      </div>
      <div className="relative mt-3 min-w-0 sm:mt-5">
        <p className="truncate text-xs font-medium text-white/80 sm:text-sm">{card.bank}</p>
        <p className="font-display text-lg tracking-tight sm:text-xl">FD Credit Card</p>
      </div>
      <div className="relative mt-auto flex items-end justify-between gap-3 pt-3">
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 sm:text-xs">
          Powered by {card.powered}
        </p>
        {action}
      </div>
    </div>
  );
}

export function productTitle(code: string, fallback: string) {
  return PITCH[code]?.title ?? fallback;
}

export function CatalogShowcase({ categories }: { categories: CatalogCategory[] }) {
  const visible = useMemo(() => {
    const rows = categories
      .map((category) => ({
        ...category,
        items:
          category.code === "FD_CARD"
            ? []
            : category.items.filter((item) => item.active && item.rail !== "ZET_LINK"),
      }))
      .filter((category) => category.code === "FD_CARD" || category.items.length > 0);
    const fd = rows.filter((category) => category.code === "FD_CARD");
    const rest = rows.filter((category) => category.code !== "FD_CARD");
    const lead =
      fd.length > 0
        ? fd.map((category) => ({ ...category, name: "FD Credit Card" }))
        : [{ code: "FD_CARD", name: "FD Credit Card", items: [] }];
    return [...lead, ...rest];
  }, [categories]);
  const [categoryCode, setCategoryCode] = useState("ALL");
  const shown = categoryCode === "ALL" ? visible : visible.filter((category) => category.code === categoryCode);
  const offerCount = visible.reduce((n, category) => n + (category.code === "FD_CARD" ? 3 : category.items.length), 0);

  if (visible.length === 0) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-black px-6 py-16 text-center text-white">
        <Sparkles className="mx-auto h-8 w-8 text-emerald-300" />
        <p className="mt-4 font-display text-3xl tracking-tight">Nothing to show yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/70">Products appear here when they are available to offer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-black px-6 py-8 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Show this screen
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">What would you like today?</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Credit cards, loans, and savings accounts. You apply on your phone. The bank decides approval, and the money stays with the bank.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-3 py-1.5 font-semibold text-black">
              <ShieldCheck className="h-4 w-4" /> {offerCount} products
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-medium text-white/90">
              <Smartphone className="h-4 w-4 text-emerald-300" /> Apply on your phone
            </span>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-10 -mx-1 flex gap-2 overflow-x-auto bg-[#f7f7f5]/90 px-1 py-2 backdrop-blur">
        <FilterChip active={categoryCode === "ALL"} onClick={() => setCategoryCode("ALL")} icon={<Sparkles className="h-4 w-4" />}>
          All
        </FilterChip>
        {visible.map((category) => (
          <FilterChip
            key={category.code}
            active={categoryCode === category.code}
            onClick={() => setCategoryCode(category.code)}
            icon={CATEGORY_ICON[category.code] ?? <CreditCard className="h-4 w-4" />}
          >
            {category.name}
          </FilterChip>
        ))}
      </div>

      {shown.map((category) => {
        if (category.code === "FD_CARD") {
          return <FdCreditCardSection key="FD_CARD" />;
        }
        const accent = ACCENT[CATEGORY_ACCENT[category.code] ?? "emerald"];
        return (
          <section key={category.code} className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${accent.chip}`}>
                  {CATEGORY_ICON[category.code]}
                  {category.name}
                </p>
                <h2 className="mt-2 font-display text-3xl tracking-tight text-black">{categoryHeadline(category.code)}</h2>
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {category.items.map((item) => {
                const pitch = PITCH[item.code];
                const tone = ACCENT[pitch?.accent ?? CATEGORY_ACCENT[category.code] ?? "emerald"];
                const title = pitch?.title ?? item.name;
                const features = pitch?.features ?? [];
                return (
                  <article
                    key={item.id}
                    className={`group overflow-hidden rounded-[1.75rem] border border-black/10 bg-white shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)] transition duration-300 hover:-translate-y-1 ${tone.ring}`}
                  >
                    <div className={`relative bg-gradient-to-br ${tone.wash} px-6 pb-8 pt-6`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className={`grid h-14 w-14 place-items-center rounded-2xl shadow-lg ${tone.icon}`}>
                          {CATEGORY_ICON[category.code] ?? <CreditCard className="h-5 w-5" />}
                        </div>
                        {pitch?.banks && (
                          <span className="max-w-[14rem] rounded-full bg-white/80 px-3 py-1 text-right text-xs font-semibold text-black shadow-sm">
                            {pitch.banks}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-6 font-display text-3xl tracking-tight text-black">{title}</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-black/70">{pitch?.promise ?? item.name}</p>
                    </div>
                    {features.length > 0 && (
                      <ul className="space-y-3 px-6 py-5">
                        {features.map((feature) => (
                          <li key={feature} className="flex gap-3 text-sm leading-relaxed text-black/80">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-black text-emerald-300">
                              <Check className="h-3 w-3" aria-hidden />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-center text-xs text-navy-500">
        After the customer picks a product, start the application from their customer record.
      </p>
    </div>
  );
}

function FdCreditCardSection() {
  return (
    <section className="space-y-5">
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-950">
          <CreditCard className="h-3.5 w-3.5" />
          FD Credit Card
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-black sm:text-4xl">Cobranded bank cards</h2>
        <p className="mt-1 text-sm text-black/60">Powered by ZET, NOVU and GrowMore. Your deposit stays with the bank and sets the card limit.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {FD_BANKS.map((card) => (
          <article key={card.mark} className="space-y-3">
            <FdBankCard card={card} />
            <p className="px-1 text-sm text-black/70">
              A secured card with {card.bank}. Apply on your phone. The deposit stays with the bank.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
        active ? "bg-black text-emerald-300" : "border border-black/10 bg-white text-black hover:border-black/30"
      }`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function categoryHeadline(code: string) {
  switch (code) {
    case "CREDIT_CARD":
      return "A card for everyday spend";
    case "FD_CARD":
      return "Cobranded bank cards";
    case "INSTANT_LOAN":
      return "Money when you need it sooner";
    case "PERSONAL_LOAN":
      return "A loan for personal plans";
    case "BUSINESS_LOAN":
      return "Capital for the shop";
    case "SAVINGS":
      return "A new savings account";
    default:
      return "Available to offer";
  }
}
