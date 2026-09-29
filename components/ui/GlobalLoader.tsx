"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLoader } from "@/stores/loader.store";

export function NeonSpinner({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <span className="gfin-neon-ring absolute inset-0" />
      <span className="absolute inset-[5px] rounded-full bg-black shadow-[0_0_24px_rgba(110,231,183,0.35)]" />
      <span className="absolute inset-0 grid place-items-center font-display text-lg font-semibold tracking-tight text-emerald-300">
        G
      </span>
    </div>
  );
}

export function GlobalLoader() {
  const pending = useLoader((s) => s.pending);
  const releaseOnPath = useLoader((s) => s.releaseOnPath);
  const pathname = usePathname();

  useEffect(() => {
    if (!releaseOnPath || pathname !== releaseOnPath) return;
    const frame = requestAnimationFrame(() => {
      useLoader.getState().releaseNavigation();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, releaseOnPath]);

  if (pending < 1) return null;

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-black/80 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <NeonSpinner />
        <p className="text-xs font-medium tracking-[0.2em] text-emerald-300/80">WORKING</p>
      </div>
    </div>
  );
}
