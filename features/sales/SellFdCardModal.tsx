"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, formatApiError, openDetails } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useLoader } from "@/stores/loader.store";
import { useSession } from "@/stores/session.store";
import { Alert, Modal } from "@/components/ui/primitives";
import { FD_CARD_FACE, FdBankCard } from "@/features/sales/CatalogShowcase";

type FdOffer = {
  id: string;
  code: string;
  name: string;
  provider?: string;
  preference_rank?: number;
  retailer_commission?: number | null;
  existing_lead_id?: string;
};

type Eligibility = {
  products: FdOffer[];
  message?: string;
};

export function SellFdCardModal({
  open,
  customerId,
  salesPath,
  onClose,
}: {
  open: boolean;
  customerId: string;
  salesPath: string;
  onClose: () => void;
}) {
  const token = useSession((s) => s.token);
  const router = useRouter();
  const [offers, setOffers] = useState<FdOffer[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    setOffers([]);
    setMessage(null);
    setError(null);
    setSelectedId(null);
    setBusy(false);
    setLoading(true);
    api<Eligibility>(`/api/v1/customers/${customerId}/eligibility`, {
      token,
      method: "POST",
      body: JSON.stringify({ categoryCode: "FD_CARD", budget: 1 }),
    })
      .then((result) => {
        const products = [...(result.products ?? [])].sort(
          (a, b) => (a.preference_rank ?? 999) - (b.preference_rank ?? 999),
        );
        setOffers(products);
        setMessage(products.length === 0 ? (result.message ?? "No FD card is available for this customer.") : null);
      })
      .catch((e) => setError(formatApiError(e, "Could not load FD cards")))
      .finally(() => setLoading(false));
  }, [open, token, customerId]);

  const selected = offers.find((offer) => offer.id === selectedId) ?? null;

  function goToSale(leadId: string) {
    useLoader.getState().begin();
    openDetails(`${salesPath}/${leadId}`, (href) => router.push(href));
  }

  async function generate() {
    if (!selected) return;
    if (selected.existing_lead_id) {
      goToSale(selected.existing_lead_id);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const lead = await api<{ id?: string }>(`/api/v1/customers/${customerId}/leads`, {
        token,
        method: "POST",
        holdLoader: true,
        body: JSON.stringify({ catalogItemId: selected.id, budget: 1 }),
      });
      if (!lead.id) {
        useLoader.getState().end();
        setError("The sale was not created");
        setBusy(false);
        return;
      }
      openDetails(`${salesPath}/${lead.id}`, (href) => router.push(href));
    } catch (err) {
      setError(formatApiError(err, "Could not generate the link"));
      setBusy(false);
    }
  }

  const commissionLabel = selected
    ? selected.retailer_commission == null
      ? "Commission for this card is not set."
      : `You earn ${inr(selected.retailer_commission)} when this card is activated.`
    : null;

  return (
    <Modal
      open={open}
      wide
      title="Sell FD Card"
      description="Cards follow the preference set for this customer. Select a card, then generate the link."
      onClose={onClose}
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {loading ? (
          <div className="h-48 animate-pulse rounded-[1.35rem] bg-[#f5f5f5]" />
        ) : message ? (
          <Alert>{message}</Alert>
        ) : (
          <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
            {offers.map((offer) => {
              const face = FD_CARD_FACE[offer.code] ?? {
                bank: offer.name,
                mark: offer.code,
                powered: offer.provider ?? "FD",
                face: "from-[#063226] via-[#0f6b45] to-[#c9a227]",
                shine: "from-white/30",
              };
              const picked = offer.id === selectedId;
              return (
                <div
                  key={offer.id}
                  className={`rounded-[1.35rem] ${picked ? "ring-2 ring-emerald-400 ring-offset-2" : ""}`}
                >
                  <FdBankCard
                    card={face}
                    action={
                      <button
                        type="button"
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md sm:px-4 sm:py-2 sm:text-sm ${
                          picked ? "bg-emerald-300 text-black" : "bg-white text-navy-950"
                        }`}
                        onClick={() => setSelectedId(offer.id)}
                      >
                        {picked ? "Selected" : "Select"}
                      </button>
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm font-semibold leading-snug text-navy-800">{commissionLabel}</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            {selected && (
              <button type="button" className="btn-primary" disabled={busy} onClick={generate}>
                {busy ? "Generating…" : "Generate"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
