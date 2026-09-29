"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CreditCard, Link2, Shuffle } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { useSession } from "@/stores/session.store";
import { Modal } from "@/components/ui/primitives";
import { Flash, TextField, useFlash } from "@/features/admin/AdminChrome";
import { EntityHero, type ManageAction } from "@/features/console/EntityChrome";
import { FD_PROVIDER_BLURB, fdBanksLabel, fdJourneyLabel, fdProviderStatus } from "@/features/admin/fd-provider-display";
import type { FdProvider } from "@/features/admin/types";

function moneyFrom(value: unknown) {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function amountsFromRule(rule: FdProvider["commission_rule"]) {
  const received = moneyFrom(rule?.flat_fee);
  if (rule?.retailer_amount != null || rule?.distributor_amount != null) {
    return {
      received: rule?.flat_fee == null ? "" : String(rule.flat_fee),
      retailer: rule?.retailer_amount == null ? "" : String(rule.retailer_amount),
      distributor: rule?.distributor_amount == null ? "" : String(rule.distributor_amount),
    };
  }
  const rPct = moneyFrom(rule?.retailer_share_pct);
  const dPct = moneyFrom(rule?.distributor_share_pct);
  return {
    received: received ? String(received) : "",
    retailer: received ? String(round2((received * rPct) / 100)) : "",
    distributor: received ? String(round2((received * dPct) / 100)) : "",
  };
}

export default function FdProviderDetailPage() {
  const { code } = useParams<{ code: string }>();
  const token = useSession((s) => s.token);
  const flash = useFlash();
  const [provider, setProvider] = useState<FdProvider | null>(null);
  const [fallbackRank, setFallbackRank] = useState("");
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [pendingToggle, setPendingToggle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState("");
  const [retailerAmount, setRetailerAmount] = useState("");
  const [distributorAmount, setDistributorAmount] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  async function load() {
    const row = await api<FdProvider>(`/api/v1/admin/fd-cards/providers/${code}`, { token });
    setProvider(row);
    setFallbackRank(String(row.fallback_rank));
    const urls: Record<string, string> = {};
    for (const item of row.catalog_items ?? []) {
      urls[item.code] = item.apply_url ?? "";
    }
    setUrlDrafts(urls);
    const amounts = amountsFromRule(row.commission_rule);
    setReceived(amounts.received);
    setRetailerAmount(amounts.retailer);
    setDistributorAmount(amounts.distributor);
    setAcknowledged(false);
  }

  useEffect(() => {
    if (token && code) load().catch((e) => flash.fail(e, "Failed to load provider"));
  }, [token, code]);

  async function saveConfig(e: FormEvent) {
    e.preventDefault();
    if (!provider) return;
    setBusy(true);
    try {
      setProvider(
        await api<FdProvider>(`/api/v1/admin/fd-cards/providers/${code}/config`, {
          token,
          method: "PATCH",
          body: JSON.stringify({
            fallbackRank: Number(fallbackRank),
            applyUrls: urlDrafts,
          }),
        }),
      );
      flash.ok("Provider configuration saved.");
      await load();
    } catch (err) {
      flash.fail(err, "Could not save configuration");
    } finally {
      setBusy(false);
    }
  }

  async function confirmToggle() {
    if (!provider) return;
    setBusy(true);
    try {
      setProvider(
        await api<FdProvider>(`/api/v1/admin/fd-cards/providers/${code}`, {
          token,
          method: "PATCH",
          body: JSON.stringify({ enabled: !provider.enabled }),
        }),
      );
      setPendingToggle(false);
      flash.ok(`${provider.name} is now ${!provider.enabled ? "enabled" : "disabled"}.`);
      await load();
    } catch (err) {
      flash.fail(err, "Could not update provider");
    } finally {
      setBusy(false);
    }
  }

  const receivedN = moneyFrom(received);
  const retailerN = moneyFrom(retailerAmount);
  const distributorN = moneyFrom(distributorAmount);
  const profit = round2(receivedN - retailerN - distributorN);
  const splitValid = receivedN >= 0 && retailerN >= 0 && distributorN >= 0 && profit >= 0;
  const hasRule = Boolean(provider?.commission_rule?.id);

  const profitHint = useMemo(() => {
    if (!splitValid) return "Retailer and distributor amounts cannot exceed amount received.";
    return `After paying the retailer and distributor, ${inr(profit)} stays with the platform.`;
  }, [splitValid, profit]);

  function setAmount(setter: (v: string) => void, value: string) {
    setter(value);
    setAcknowledged(false);
  }

  async function saveCommission(e: FormEvent) {
    e.preventDefault();
    if (!acknowledged || !splitValid) return;
    setBusy(true);
    try {
      await api(`/api/v1/admin/fd-cards/providers/${code}/commission`, {
        token,
        method: "PUT",
        body: JSON.stringify({
          rule: {
            flatFee: receivedN,
            retailerAmount: retailerN,
            distributorAmount: distributorN,
          },
        }),
      });
      flash.ok(hasRule ? "Commission saved." : "Commission added.");
      await load();
    } catch (err) {
      flash.fail(err, "Could not save commission");
    } finally {
      setBusy(false);
    }
  }

  if (!provider) return <div className="card h-40 animate-pulse bg-[#f5f5f5]" />;

  const retailerHint = retailerAmount ? inr(retailerN) : "Not set";
  const manageActions: ManageAction[] = [
    {
      label: provider.enabled ? "Disable provider" : "Enable provider",
      onClick: () => setPendingToggle(true),
      tone: provider.enabled ? "danger" : "default",
    },
  ];

  return (
    <div className="space-y-5">
      <Link href="/admin/settings?tab=fd-cards" className="text-sm font-semibold text-navy-700 underline">
        FD Cards
      </Link>
      <Flash message={flash.message} error={flash.error} />
      <EntityHero
        title={provider.name}
        status={fdProviderStatus(provider)}
        code={provider.code}
        lines={[
          <p key="banks" className="flex items-center gap-1.5 text-sm text-white/70">
            <CreditCard className="h-3.5 w-3.5" />
            {fdBanksLabel(provider.catalog_items)}
          </p>,
          <p key="journey" className="flex items-center gap-1.5 text-sm text-white/70">
            <Link2 className="h-3.5 w-3.5" />
            {fdJourneyLabel(provider.catalog_items)}
          </p>,
          ...(provider.novu
            ? [
                <p key="novu" className="flex items-center gap-1.5 text-sm text-white/70">
                  <Shuffle className="h-3.5 w-3.5" />
                  Novu (one customer registration)
                </p>,
              ]
            : []),
          ...(FD_PROVIDER_BLURB[provider.code]
            ? [
                <p key="blurb" className="text-xs text-white/50">{FD_PROVIDER_BLURB[provider.code]}</p>,
              ]
            : []),
        ]}
        manageActions={manageActions}
        stats={[
          { label: "Commission type", value: provider.commission_rule?.commission_type ?? "FIXED" },
          { label: "Fallback rank", value: String(provider.fallback_rank) },
          { label: "Retailer payout", value: retailerHint },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <form className="card space-y-4" onSubmit={saveConfig}>
          <h2 className="font-display text-lg text-navy-950">Links & routing</h2>
          <TextField label="Fallback rank" value={fallbackRank} onChange={setFallbackRank} inputMode="numeric" />
          {(provider.catalog_items ?? []).map((item) => (
            <TextField
              key={item.code}
              label={
                item.rail === "PAYSPRINT_FD"
                  ? `${item.name} (dynamic — no URL needed)`
                  : `${item.name} apply URL`
              }
              value={urlDrafts[item.code] ?? ""}
              onChange={(v) => setUrlDrafts((d) => ({ ...d, [item.code]: v }))}
            />
          ))}
          <button type="submit" className="btn-primary" disabled={busy}>
            Save configuration
          </button>
        </form>

        <form className="card flex flex-col space-y-4" onSubmit={saveCommission}>
          <div>
            <h2 className="font-display text-lg text-navy-950">Commission on conversion</h2>
            <p className="mt-1 text-sm text-navy-600">
              Enter the rupees you receive per card, then the fixed payout to the retailer and distributor. Type is FIXED so a percentage model can be added later.
            </p>
          </div>
          <TextField
            label="Amount received per card ₹"
            value={received}
            onChange={(v) => setAmount(setReceived, v)}
            inputMode="numeric"
            required
          />
          <TextField
            label="Retailer amount ₹"
            value={retailerAmount}
            onChange={(v) => setAmount(setRetailerAmount, v)}
            inputMode="numeric"
            required
          />
          <TextField
            label="Distributor amount ₹"
            value={distributorAmount}
            onChange={(v) => setAmount(setDistributorAmount, v)}
            inputMode="numeric"
            required
          />
          <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-navy-500">Profit per card</p>
              <p className={`font-display text-2xl ${splitValid ? "text-navy-950" : "text-rose-700"}`}>
                {splitValid ? inr(profit) : "—"}
              </p>
              <p className="mt-1 max-w-xs text-xs text-navy-500">{profitHint}</p>
              <label className="mt-3 flex items-start gap-2 text-sm text-navy-800">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={acknowledged}
                  disabled={!splitValid}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <span>I acknowledge the profit per card after retailer and distributor payouts.</span>
              </label>
            </div>
            <button type="submit" className="btn-primary self-start sm:self-end" disabled={busy || !acknowledged || !splitValid}>
              {hasRule ? "Save commission" : "Add commission"}
            </button>
          </div>
        </form>
      </div>

      <Modal
        open={pendingToggle}
        title={provider.enabled ? "Disable provider" : "Enable provider"}
        description={
          provider.enabled
            ? "Retailers will stop seeing this provider in FD eligibility immediately."
            : "Retailers can offer this provider when it is next in preference and its app has not been used."
        }
      >
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => setPendingToggle(false)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={busy} onClick={confirmToggle}>
            {busy ? "Saving…" : provider.enabled ? "Yes, disable" : "Yes, enable"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
