"use client";

import { api } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";

export type CatalogItem = {
  id: string;
  code: string;
  category_code: string;
  name: string;
  provider: string;
  rail: string;
  external_product?: string;
  active: boolean;
  payout_hint?: string;
};

export type CatalogCategory = {
  code: string;
  name: string;
  payout_hint?: string;
  items: CatalogItem[];
};

export function CatalogView({
  categories,
  manage,
  onChanged,
}: {
  categories: CatalogCategory[];
  manage?: boolean;
  onChanged?: () => void;
}) {
  const token = useSession((s) => s.token);

  async function toggle(item: CatalogItem) {
    await api(`/api/v1/admin/catalog/items/${item.id}`, {
      token,
      method: "PATCH",
      body: JSON.stringify({ active: !item.active }),
    });
    onChanged?.();
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <section key={category.code} className="space-y-3">
          <div>
            <h2 className="font-display text-xl text-navy-950">{category.name}</h2>
            {category.payout_hint && <p className="text-sm text-navy-500">{category.payout_hint}</p>}
          </div>
          {category.items.length === 0 ? (
            <p className="text-sm text-navy-400">No items in this category.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {category.items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-navy-900/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-navy-950">{item.name}</p>
                      <p className="mt-1 text-xs text-navy-500">{item.provider} · {item.external_product ?? item.rail}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-navy-500"}`}>
                      {item.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  {item.payout_hint && <p className="mt-3 text-sm text-navy-600">{item.payout_hint}</p>}
                  {manage && (
                    <button type="button" className="btn-secondary mt-4 text-sm" onClick={() => toggle(item)}>
                      {item.active ? "Hide" : "Show"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
