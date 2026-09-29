"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { useLoader } from "@/stores/loader.store";
import { useSession } from "@/stores/session.store";
import { Alert, Field, Modal } from "@/components/ui/primitives";
import { productTitle } from "@/features/sales/CatalogShowcase";
import { LinkShare } from "@/features/sales/LinkShare";
import type { CatalogCategory } from "@/features/sales/CatalogView";

type EligibleProduct = {
  id: string;
  code: string;
  name: string;
  existing_lead_id?: string;
  payment_link_url?: string;
  state?: string;
};

type Eligibility = {
  category_name: string;
  budget: number;
  products: EligibleProduct[];
  message?: string;
};

export function AddProductModal({
  open,
  customerId,
  customerName,
  salesPath,
  onClose,
}: {
  open: boolean;
  customerId: string;
  customerName: string;
  salesPath: string;
  onClose: () => void;
}) {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [categoryCode, setCategoryCode] = useState("");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<Eligibility | null>(null);
  const [pending, setPending] = useState<EligibleProduct | null>(null);
  const [share, setShare] = useState<{ url: string; product: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    setCategoryCode("");
    setBudget("");
    setResult(null);
    setPending(null);
    setShare(null);
    setError(null);
    api<CatalogCategory[]>("/api/v1/catalog", { token })
      .then((rows) => setCategories(rows.filter((row) => row.items.some((item) => item.active))))
      .catch((e) => setError(formatApiError(e, "Could not load categories")));
  }, [open, token]);

  async function check(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setShare(null);
    try {
      setResult(await api<Eligibility>(`/api/v1/customers/${customerId}/eligibility`, {
        token,
        method: "POST",
        body: JSON.stringify({ categoryCode, budget: fdCategory ? 1 : Number(budget) }),
      }));
    } catch (err) {
      setError(formatApiError(err, "Eligibility check failed"));
    } finally {
      setBusy(false);
    }
  }

  function showExisting(product: EligibleProduct) {
    if (!product.payment_link_url) return;
    setShare({ url: product.payment_link_url, product: productTitle(product.code, product.name) });
    onClose();
  }

  async function confirmGenerate() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const lead = await api<{ id?: string; payment_link_url?: string }>(`/api/v1/customers/${customerId}/leads`, {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({ catalogItemId: pending.id, budget: categoryCode === "FD_CARD" ? 1 : Number(budget) }),
      });
      if (!lead.id || !lead.payment_link_url) {
        useLoader.getState().end();
        setError("The link was not returned");
        setPending(null);
        return;
      }
      openDetails(`${salesPath}/${lead.id}`, (href) => router.push(href));
    } catch (err) {
      setError(formatApiError(err, "Could not generate the link"));
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  const fdCategory = categoryCode === "FD_CARD";
  const amount = Number(budget);

  return (
    <>
    <Modal
      open={open}
      title="Add product"
      description={`Check what ${customerName} can take, then generate a QR for the one they want.`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <form className="space-y-3" onSubmit={check}>
          <Field label="Category">
            <select className="field" required value={categoryCode} onChange={(e) => { setCategoryCode(e.target.value); setResult(null); }}>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.code} value={category.code}>{category.name}</option>
              ))}
            </select>
          </Field>
          {!fdCategory && (
            <Field label="Budget">
              <input
                className="field"
                required
                inputMode="numeric"
                placeholder="Amount in rupees"
                value={budget}
                onChange={(e) => { setBudget(e.target.value.replace(/\D/g, "").slice(0, 9)); setResult(null); }}
              />
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn-primary" disabled={busy || !categoryCode || (!fdCategory && amount <= 0)}>
              {busy ? "Checking…" : "Check eligibility"}
            </button>
          </div>
        </form>

        {result && (
          <div className="space-y-3 border-t border-black/10 pt-4">
            <h3 className="text-sm font-semibold text-navy-950">Eligible products</h3>
            {result.products.length === 0 ? (
              <Alert>{result.message ?? "No eligible product for this budget."}</Alert>
            ) : (
              <ul className="space-y-2">
                {result.products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 px-3 py-3">
                    <div>
                      <p className="font-semibold text-navy-950">{productTitle(product.code, product.name)}</p>
                      <p className="text-xs text-navy-500">{result.category_name}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary shrink-0"
                      disabled={busy}
                      onClick={() => (product.payment_link_url ? showExisting(product) : setPending(product))}
                    >
                      {product.payment_link_url ? "Show QR" : "Generate link"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </Modal>

      <Modal
        open={pending != null}
        title="Generate link"
        description="Are you sure you want to generate this link? Once it is generated, the same link cannot be generated again."
      >
        <p className="text-sm font-semibold text-navy-950">
          {pending ? productTitle(pending.code, pending.name) : ""}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => setPending(null)}>Cancel</button>
          <button type="button" className="btn-primary" disabled={busy} onClick={confirmGenerate}>
            {busy ? "Generating…" : "Yes, generate"}
          </button>
        </div>
      </Modal>

      <Modal
        open={share != null}
        title="Customer link"
        description={share ? `${share.product} for ${customerName}` : undefined}
      >
        {share && <LinkShare url={share.url} caption={`${customerName}, continue your application.`} />}
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" onClick={() => setShare(null)}>Done</button>
        </div>
      </Modal>
    </>
  );
}
