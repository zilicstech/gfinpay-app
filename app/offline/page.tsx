import { Logo } from "@/components/brand/Logo";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6">
      <div className="max-w-sm text-center">
        <Logo />
        <h1 className="mt-8 font-display text-3xl text-navy-950">You&apos;re offline</h1>
        <p className="mt-3 text-sm text-navy-700">Balances and transactions are never cached. Reconnect to move money.</p>
      </div>
    </main>
  );
}
