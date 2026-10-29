"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Users, Store, PieChart, Percent, Wallet, ArrowLeftRight,
  Landmark, LogOut, MessageSquare, Settings, Shield, ShieldCheck, Receipt, Scale, LayoutGrid,
  ClipboardList,
  HeartPulse,
  ChevronDown, UserRound, Zap, Smartphone, Tv, CarFront, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NeonSpinner } from "@/components/ui/GlobalLoader";
import { logoutSession } from "@/lib/auth-client";
import {
  homeFor,
  homePathFor,
  isSessionExpired,
  profilePathFor,
  roleLabel,
  useSession,
  useSessionHydrated,
} from "@/stores/session.store";

const SIDEBAR_KEY = "gfinpay-sidebar-collapsed";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/admin/analytics": PieChart,
  "/admin/distributors": Users,
  "/admin/retailers": Store,
  "/admin/inquiries": MessageSquare,
  "/distributor/inquiries": MessageSquare,
  "/admin/vendors": Store,
  "/admin/customers": UserRound,
  "/admin/onboarding": Users,
  "/admin/users": Users,
  "/admin/reports": PieChart,
  "/admin/audit": ClipboardList,
  "/admin/earnings": Percent,
  "/admin/admins": Shield,
  "/admin/auditors": Scale,
  "/admin/finance": Wallet,
  "/auditor/overview": LayoutDashboard,
  "/auditor/settings": Settings,
  "/auditor/requests": Scale,
  "/auditor/retailers": Wallet,
  "/auditor/customers": UserRound,
  "/auditor/profile": UserRound,
  "/agent/activate": ShieldCheck,
  "/admin/transactions": Receipt,
  "/admin/recon": Scale,
  "/admin/sales": Receipt,
  "/admin/hospi-cash": HeartPulse,
  "/agent/hospi-cash": HeartPulse,
  "/distributor/hospi-cash": HeartPulse,
  "/admin/settings": Settings,
  "/admin/profile": UserRound,
  "/agent/dashboard": LayoutDashboard,
  "/agent/kyc": ShieldCheck,
  "/agent/wallet": Wallet,
  "/agent/dmt": ArrowLeftRight,
  "/agent/bbps": Zap,
  "/agent/aeps": Landmark,
  "/agent/cash-out/upi": Landmark,
  "/agent/catalog": LayoutGrid,
  "/agent/sales": Receipt,
  "/distributor/overview": LayoutDashboard,
  "/distributor/earnings": Percent,
  "/distributor/agents": Store,
  "/distributor/finance": Wallet,
  "/distributor/customers": Users,
  "/distributor/catalog": LayoutGrid,
  "/distributor/sales": Receipt,
  "/distributor/transactions": Receipt,
  "/distributor/profile": UserRound,
  "/agent/transactions": Receipt,
  "/agent/customers": Users,
  "/agent/reports": PieChart,
  "/agent/more": Settings,
  "/agent/settings": Settings,
  "/agent/profile": UserRound,
};

type NavItem = { href: string; label: string };

export function AppShell({
  title,
  allowedTypes,
  nav,
  children,
}: {
  title: string;
  allowedTypes: string[];
  nav: NavItem[];
  mobileNav?: NavItem[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, expiresAt, clear, loadProfile, profileLoaded, bootstrapped } = useSession();
  const hydrated = useSessionHydrated();
  const signedOutHome = homePathFor();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const openIconClass = `h-6 w-6 ${mobileOpen ? "hidden" : "block"} ${collapsed ? "md:block" : "md:hidden"}`;
  const closeIconClass = `h-6 w-6 ${mobileOpen ? "block" : "hidden"} ${collapsed ? "md:hidden" : "md:block"}`;

  function toggleSidebar() {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
        } catch {
          /* ignore */
        }
        return next;
      });
      return;
    }
    setMobileOpen((open) => !open);
  }

  useEffect(() => {
    // bootstrapped means the silent refresh has settled, so an absent token is conclusive.
    if (!hydrated || !bootstrapped) return;
    if (token && isSessionExpired(expiresAt)) {
      clear();
      router.replace(signedOutHome);
      return;
    }
    if (!token) {
      router.replace(signedOutHome);
      return;
    }
    if (!profileLoaded) {
      loadProfile().catch(() => {
        clear();
        router.replace(signedOutHome);
      });
      return;
    }
    if (user && !allowedTypes.includes(user.userType)) {
      router.replace(homeFor(user.userType, user.status));
    }
  }, [allowedTypes, bootstrapped, clear, expiresAt, hydrated, loadProfile, profileLoaded, router, signedOutHome, token, user]);

  if (
    !hydrated ||
    !bootstrapped ||
    !token ||
    !user ||
    (!profileLoaded && !user.fullName) ||
    (!!user.userType && !allowedTypes.includes(user.userType))
  ) {
    return (
      <div className="grid min-h-screen place-items-center bg-black">
        <NeonSpinner />
      </div>
    );
  }

  const profileHref = profilePathFor(user.userType);

  return (
    <div className={`min-h-screen bg-white transition-[padding] duration-200 ${collapsed ? "md:pl-[72px]" : "md:pl-[260px]"}`}>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 top-16 z-30 bg-navy-950/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`fixed bottom-0 left-0 top-16 z-40 flex w-[260px] flex-col border-r border-slate-200/80 bg-white shadow-xl transition-transform duration-200 md:top-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } ${collapsed ? "md:w-[72px] md:translate-x-0 md:shadow-none" : "md:w-[260px] md:translate-x-0 md:shadow-none"}`}>
        <div className={`flex h-16 shrink-0 items-center border-b border-slate-200/80 px-4 transition-all duration-200 ${
          collapsed ? "md:justify-center md:px-2" : ""
        }`}>
          <p className={`min-w-0 truncate text-xs font-bold uppercase tracking-wider text-slate-400 ${collapsed ? "md:hidden" : ""}`}>
            {title}
          </p>
        </div>
        <nav className={`flex-1 space-y-0.5 overflow-y-auto px-3 py-4 ${collapsed ? "md:px-2" : "md:px-3"}`}>
          {nav.map((item) => {
            const Icon = ICONS[item.href] ?? LayoutDashboard;
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                  collapsed ? "md:justify-center md:gap-0 md:px-0" : ""
                } ${active ? "bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white shadow-md shadow-navy-950/20 font-semibold" : "text-slate-600 hover:bg-slate-100/80 hover:text-navy-950"}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-emerald-400" : "text-slate-400"}`} />
                <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-2xs">
        <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-navy-950 transition-colors"
              aria-label="Toggle menu"
              title="Toggle sidebar"
            >
              <PanelLeftOpen className={openIconClass} />
              <PanelLeftClose className={closeIconClass} />
            </button>
            <Logo height={42} href={homeFor(user.userType, user.status)} />
          </div>

          <AccountMenu
            name={user.fullName}
            code={user.code}
            role={roleLabel(user.userType)}
            email={user.email ?? undefined}
            mobile={user.mobile ?? undefined}
            profileHref={profileHref}
            onLogout={async () => { await logoutSession(); router.replace(signedOutHome); }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-6">{children}</main>
    </div>
  );
}

function AccountMenu({
  name,
  code,
  role,
  email,
  mobile,
  profileHref,
  onLogout,
}: {
  name: string;
  code?: string;
  role: string;
  email?: string;
  mobile?: string;
  profileHref: string;
  onLogout: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
  const displayCode = code?.trim();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative ml-auto" ref={ref}>
      <button
        type="button"
        className={`inline-flex items-center gap-2.5 rounded-full p-1 sm:pl-1 sm:pr-3 transition-all border ${
          open
            ? "bg-slate-100 border-slate-300/80 shadow-xs ring-2 ring-emerald-500/20"
            : "hover:bg-slate-100/80 border-transparent hover:border-slate-200/80"
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${name}, ${role}`}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 text-xs font-bold text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs">
          {initials}
        </span>
        <span className="hidden text-left md:block">
          <span className="block max-w-[12rem] truncate text-sm font-semibold text-navy-950">{name}</span>
          <span className="block text-[11px] text-slate-500 font-medium">{role}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-navy-950" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-2 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          {/* User Info Header */}
          <div className="flex items-start gap-3 p-3 border-b border-slate-100">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 text-xs font-bold text-emerald-300 shadow-xs ring-1 ring-white/10">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-navy-950">{name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
                  {role}
                </span>
                {displayCode && (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                    {displayCode}
                  </span>
                )}
              </div>
              {(email || mobile) && (
                <p className="mt-1 text-[11px] text-slate-400 truncate font-medium">
                  {email || `+91 ${mobile}`}
                </p>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1.5 space-y-0.5">
            <Link
              href={profileHref}
              className="group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100/80 hover:text-navy-950 transition-colors"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                  <UserRound className="h-4 w-4" />
                </div>
                <span>My Profile</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors font-medium">View & Edit</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="pt-1.5 border-t border-slate-100">
            <button
              type="button"
              className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 transition-colors"
              onClick={onLogout}
              role="menuitem"
            >
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
                  <LogOut className="h-4 w-4" />
                </div>
                <span>Log Out</span>
              </div>
              <span className="text-[10px] text-rose-400 group-hover:text-rose-600 font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
