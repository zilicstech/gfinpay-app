import { SiteFooter } from "@/features/marketing/SiteFooter";
import { SiteHeader } from "@/features/marketing/SiteHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-navy-950">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
