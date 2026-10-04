"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Users, Store, PieChart, Percent, Wallet, ArrowLeftRight,
  Landmark, LogOut, Settings, Shield, Receipt, Scale, LayoutGrid,
  ChevronDown, UserRound, Zap, Smartphone, Tv, CarFront, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NeonSpinner } from "@/components/ui/GlobalLoader";
import {
  homeFor,
  isSessionExpired,
  loginPathFor,
  profilePathFor,
  roleLabel,
  useSession,
  useSessionHydrated,
} from "@/stores/session.store";

const SIDEBAR_KEY = "gfinpay-sidebar-collapsed";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/admin/analytics": PieChart,
  "/admin/overview": LayoutDashboard,
  "/admin/distributors": Users,
  "/admin/retailers": Store,
  "/admin/vendors": Store,
  "/admin/customers": UserRound,
  "/admin/onboarding": Users,
  "/admin/users": Users,
  "/admin/reports": PieChart,
  "/admin/earnings": Percent,
  "/admin/admins": Shield,
  "/admin/transactions": Receipt,
  "/admin/recon": Scale,
  "/admin/sales": Receipt,
  "/admin/settings": Settings,
  "/admin/profile": UserRound,
  "/agent/dashboard": LayoutDashboard,
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
  "/distributor/customers": Users,
  "/distributor/catalog": LayoutGrid,
  "/distributor/sales": Receipt,
  "/distributor/transactions": Receipt,
  "/distributor/profile": UserRound,
  "/agent/transactions": Receipt,
  "/agent/customers": Users,
  "/agent/reports": PieChart,
  "/agent/more": Settings,
  "/agent/profile": UserRound,
};

type NavItem = { href: string; label: string };

export function AppShell({
  title,
  allowedTypes,
  nav,
  loginHref,
  children,
}: {
  title: string;
  allowedTypes: string[];
  nav: NavItem[];
  mobileNav?: NavItem[];
  loginHref?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, expiresAt, clear, loadProfile, profileLoaded } = useSession();
  const hydrated = useSessionHydrated();
  const signIn = loginHref ?? loginPathFor(allowedTypes[0]);
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
    if (!hydrated) return;
    if (token && isSessionExpired(expiresAt)) {
      clear();
      router.replace(signIn);
      return;
    }
    if (!token) {
      router.replace(signIn);
      return;
    }
    if (!profileLoaded) {
      loadProfile().catch(() => {
        clear();
        router.replace(signIn);
      });
      return;
    }
    if (user && !allowedTypes.includes(user.userType)) {
      router.replace(homeFor(user.userType));
    }
  }, [allowedTypes, clear, expiresAt, hydrated, loadProfile, profileLoaded, router, signIn, token, user]);

  if (!hydrated || !token || !user || (!profileLoaded && !user.fullName)) {
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
            <Logo height={42} href={homeFor(user.userType)} />
          </div>

          <AccountMenu
            name={user.fullName}
            code={user.code}
            role={roleLabel(user.userType)}
            profileHref={profileHref}
            onLogout={() => { clear(); router.replace(signIn); }}
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
  profileHref,
  onLogout,
}: {
  name: string;
  code?: string;
  role: string;
  profileHref: string;
  onLogout: () => void;
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
        className="inline-flex items-center gap-2.5 rounded-full p-1 sm:pl-1 sm:pr-2.5 hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200/80"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${name}, ${role}`}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-950 text-xs font-bold text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs">
          {initials}
        </span>
        <span className="hidden text-left md:block">
          <span className="block max-w-[12rem] truncate text-sm font-semibold text-navy-950">{name}</span>
          <span className="block text-[11px] text-slate-500 font-medium">{role}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-2xl p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100" role="menu">
          <div className="px-3 py-2.5 border-b border-slate-100">
            <p className="text-sm font-bold text-navy-950 truncate">{name}</p>
            {displayCode && (
              <p className="mt-1 font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-block">
                {displayCode}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500 font-medium">{role}</p>
          </div>
          <div className="py-1">
            <Link
              href={profileHref}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-100/70 hover:text-navy-950 transition-colors"
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <UserRound className="h-4 w-4 text-slate-500" />
              <span>My Profile</span>
            </Link>
          </div>
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 transition-colors"
              onClick={onLogout}
              role="menuitem"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
