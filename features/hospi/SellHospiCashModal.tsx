"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api-client";
import { useSession } from "@/stores/session.store";
import { Alert, Modal } from "@/components/ui/primitives";
import { inr } from "@/lib/format";
import {
  EMPTY_HOSPI,
  GOOD_HEALTH,
  HospiCashFields,
  HospiHealthCheck,
  hospiPayload,
  hospiReady,
  type HospiDraft,
} from "@/features/hospi/HospiCashFields";
import { hospiCollectLine, hospiMoney, type HospiOffer } from "@/features/hospi/offer";

export function SellHospiCashModal({
  open,
  initial,
  onClose,
  onSold,
}: {
  open: boolean;
  initial?: Partial<HospiDraft>;
  onClose: () => void;
  onSold?: () => void;
}) {
  const token = useSession((s) => s.token);
  const [draft, setDraft] = useState<HospiDraft>({ ...EMPTY_HOSPI, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sold, setSold] = useState<string | null>(null);
  const [offer, setOffer] = useState<HospiOffer | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft({ ...EMPTY_HOSPI, ...initial });
    setError(null);
    setSold(null);
    if (!token) return;
    api<HospiOffer>("/api/v1/hospi-cash/offer", { token })
      .then(setOffer)
      .catch(() => setOffer(null));
  }, [open, token]);

  const price = hospiMoney(offer);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!hospiReady(draft)) {
      setError("Fill every field on the attachment form");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const row = await api<{ gfin_sale_code: string }>("/api/v1/hospi-cash", {
        method: "POST",
        token,
        body: JSON.stringify(hospiPayload(draft)),
      });
      setSold(row.gfin_sale_code);
      onSold?.();
    } catch (e) {
      setError(formatApiError(e, "Could not sell Hospi Cash"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      wide
      title="Sell Hospi Cash"
      description={`${hospiCollectLine(offer)} ${inr(price.payable)} will be deducted from your wallet. Commission is paid only after the card is activated.`}
      onClose={onClose}
    >
      {sold ? (
        <div className="space-y-4">
          <Alert tone="success">Card recorded. Sale id {sold}. It stays sold until activation.</Alert>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          {error && <Alert tone="error">{error}</Alert>}
          <HospiCashFields value={draft} onChange={setDraft} />
          <div className="flex items-center justify-between gap-4">
            <HospiHealthCheck
              checked={draft.goodHealth === GOOD_HEALTH}
              onChange={(checked) => setDraft({ ...draft, goodHealth: checked ? GOOD_HEALTH : "" })}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={busy || !hospiReady(draft)}>
              {busy ? "Selling…" : `Confirm and debit ${inr(price.payable)}`}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
