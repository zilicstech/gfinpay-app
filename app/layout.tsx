import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import { SITE } from "@/lib/site";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "gfinpay",
    "GATEWAYLINE FINTECH",
    "Business Correspondent",
    "AePS",
    "Domestic Money Transfer",
    "UPI cash out",
    "BaaS India",
    "assisted banking",
    "NPCI",
  ],
  openGraph: {
    siteName: SITE.name,
    type: "website",
    locale: "en_IN",
  },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={lexend.variable}>
      <body className="font-sans">
        {children}
        <GlobalLoader />
      </body>
    </html>
  );
}
