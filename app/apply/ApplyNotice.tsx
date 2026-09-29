import { Logo } from "@/components/brand/Logo";

export function ApplyNotice({ title, body }: { title: string; body: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <Logo compact />
        </div>
        <h1 className="mt-8 font-display text-2xl text-navy-950">{title}</h1>
        <p className="mt-3 text-sm text-navy-600">{body}</p>
      </div>
    </main>
  );
}
