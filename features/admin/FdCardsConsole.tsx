"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CreditCard, Layers, Percent, Settings2, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import { inr } from "@/lib/format";
import { DataTable, Modal, PageHeader, StatCard } from "@/components/ui/primitives";
import { Flash, FormModal, SelectField, TextField, useFlash } from "@/features/admin/AdminChrome";
import type { FdBudgetBand, FdCardSku, FdProvider } from "@/features/admin/types";

const CARD_GRADIENTS = [
  "from-indigo-600 via-violet-600 to-fuchsia-600",
  "from-sky-600 via-blue-600 to-indigo-700",
  "from-emerald-600 via-teal-600 to-cyan-700",
  "from-amber-500 via-orange-500 to-rose-500",
];

function cardLabel(card: FdCardSku) {
  return `${card.product_key} FD Card`;
}

function cardsForProvider(code: string) {
  if (code === "ZET") return "SBM and IOB · ZET app";
  if (code === "PAYSPRINT") return "SBM · NOVU app";
  if (code === "GROWMORE") return "DCB · NOVU app";
  return "—";
}

function cardSubtitle(card: FdCardSku) {
  if (card.rail === "PAYSPRINT_FD") return "PaySprint · Novu · dynamic URL";
  if (card.provider === "ZET") return "ZET · static onboarding link";
  if (card.provider === "GROWMORE") return "GrowMore · Novu · static link";
  return card.provider_name;
}

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

function CardStatusToggle({ on }: { on: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[11px] font-semibold tracking-wide text-white drop-shadow">
        {on ? "Active" : "Inactive"}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full shadow-inner ring-1 ring-black/20 transition-colors ${
          on ? "bg-emerald-400" : "bg-navy-950/70"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </span>
  );
}

export function FdCardsConsole({ token }: { token: string | null }) {
  const flash = useFlash();
  const [cards, setCards] = useState<FdCardSku[]>([]);
  const [rules, setRules] = useState<FdBudgetBand[]>([]);
  const [providers, setProviders] = useState<FdProvider[]>([]);
  const [busy, setBusy] = useState(false);

  const [linkCard, setLinkCard] = useState<FdCardSku | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [pendingCardToggle, setPendingCardToggle] = useState<FdCardSku | null>(null);
  const [toggleBusy, setToggleBusy] = useState(false);

  const [ruleModal, setRuleModal] = useState<"new" | FdBudgetBand | null>(null);
  const [ruleProvider, setRuleProvider] = useState("ZET");
  const [ruleRank, setRuleRank] = useState("1");

  const [commissionProvider, setCommissionProvider] = useState<FdProvider | null>(null);
  const [received, setReceived] = useState("");
  const [retailerAmount, setRetailerAmount] = useState("");
  const [distributorAmount, setDistributorAmount] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  async function load() {
    const [c, r, p] = await Promise.all([
      api<FdCardSku[]>("/api/v1/admin/fd-cards/cards", { token }),
      api<FdBudgetBand[]>("/api/v1/admin/fd-cards/rules", { token }),
      api<FdProvider[]>("/api/v1/admin/fd-cards/providers", { token }),
    ]);
    setCards(c);
    setRules(r);
    setProviders(p);
    if (p[0] && !ruleProvider) setRuleProvider(p[0].code);
  }

  useEffect(() => {
    if (token) load().catch((e) => flash.fail(e, "Failed to load FD settings"));
  }, [token]);

  const liveCards = useMemo(() => cards.filter((c) => c.active), [cards]);

  async function confirmCardToggle() {
    if (!pendingCardToggle) return;
    const card = pendingCardToggle;
    const enabling = !card.active;
    setToggleBusy(true);
    try {
      await api(`/api/v1/admin/fd-cards/cards/${card.code}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ active: enabling }),
      });
      setPendingCardToggle(null);
      await load();
      flash.ok(`${cardLabel(card)} is now ${enabling ? "active" : "inactive"}.`);
    } catch (err) {
      flash.fail(err, "Could not update card");
    } finally {
      setToggleBusy(false);
    }
  }

  function openLinkModal(card: FdCardSku) {
    setLinkCard(card);
    setLinkUrl(card.apply_url ?? "");
  }

  async function saveLink(e: FormEvent) {
    e.preventDefault();
    if (!linkCard) return;
    setBusy(true);
    try {
      await api(`/api/v1/admin/fd-cards/cards/${linkCard.code}`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ applyUrl: linkUrl }),
      });
      setLinkCard(null);
      await load();
      flash.ok("Card link saved.");
    } catch (err) {
      flash.fail(err, "Could not save link");
    } finally {
      setBusy(false);
    }
  }

  function openRuleModal(existing: "new" | FdBudgetBand) {
    if (existing === "new") {
      const taken = new Set(rules.map((rule) => rule.preferred_provider));
      const next = providers.find((provider) => !taken.has(provider.code));
      setRuleProvider(next?.code ?? "");
      setRuleRank(String(rules.length + 1));
    } else {
      setRuleProvider(existing.preferred_provider);
      setRuleRank(String(existing.preference_rank ?? 1));
    }
    setRuleModal(existing);
  }

  async function saveRule(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = {
      rule: {
        preferredProvider: ruleProvider,
        preferenceRank: Number(ruleRank),
      },
    };
    try {
      if (ruleModal === "new") {
        await api("/api/v1/admin/fd-cards/rules", { token, method: "POST", body: JSON.stringify(body) });
      } else if (ruleModal) {
        await api(`/api/v1/admin/fd-cards/rules/${ruleModal.id}`, { token, method: "PATCH", body: JSON.stringify(body) });
      }
      setRuleModal(null);
      await load();
      flash.ok("Rule saved.");
    } catch (err) {
      flash.fail(err, "Could not save rule");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this eligibility rule?")) return;
    setBusy(true);
    try {
      await api(`/api/v1/admin/fd-cards/rules/${id}`, { token, method: "DELETE" });
      await load();
      flash.ok("Rule removed.");
    } catch (err) {
      flash.fail(err, "Could not delete rule");
    } finally {
      setBusy(false);
    }
  }

  function openCommission(provider: FdProvider) {
    const amounts = amountsFromRule(provider.commission_rule);
    setReceived(amounts.received);
    setRetailerAmount(amounts.retailer);
    setDistributorAmount(amounts.distributor);
    setAcknowledged(false);
    setCommissionProvider(provider);
  }

  function setAmount(setter: (v: string) => void, value: string) {
    setter(value);
    setAcknowledged(false);
  }

  const receivedN = moneyFrom(received);
  const retailerN = moneyFrom(retailerAmount);
  const distributorN = moneyFrom(distributorAmount);
  const profit = round2(receivedN - retailerN - distributorN);
  const splitValid = receivedN >= 0 && retailerN >= 0 && distributorN >= 0 && profit >= 0;
  const hasRule = Boolean(commissionProvider?.commission_rule?.id);
  const profitHint = !splitValid
    ? "Retailer and distributor amounts cannot exceed amount received."
    : `After paying the retailer and distributor, ${inr(profit)} stays with the platform.`;

  async function saveCommission(e: FormEvent) {
    e.preventDefault();
    if (!commissionProvider || !acknowledged || !splitValid) return;
    setBusy(true);
    try {
      await api(`/api/v1/admin/fd-cards/providers/${commissionProvider.code}/commission`, {
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
      setCommissionProvider(null);
      await load();
      flash.ok(hasRule ? "Commission saved." : "Commission added.");
    } catch (err) {
      flash.fail(err, "Could not save commission");
    } finally {
      setBusy(false);
    }
  }

  const rankedProviders = new Set(rules.map((rule) => rule.preferred_provider));
  const providerOptions = providers
    .filter((provider) => {
      if (ruleModal === "new") return !rankedProviders.has(provider.code);
      if (ruleModal) {
        return provider.code === ruleModal.preferred_provider || !rankedProviders.has(provider.code);
      }
      return true;
    })
    .map((provider) => ({ value: provider.code, label: provider.name }));
  const providersWithCommission = providers.filter((p) => p.commission_rule?.id).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Origination"
        title="FD cards"
        description="Configure each bank card, the order providers are offered, and the fixed rupee commission paid on conversion."
      />
      <Flash message={flash.message} error={flash.error} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Cards active" value={String(liveCards.length)} hint={`${cards.length} SKUs configured`} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard label="Provider preference" value={String(rules.length)} hint="Lower number is offered first" icon={<Layers className="h-5 w-5" />} />
        <StatCard label="Commission set" value={String(providersWithCommission)} hint={`of ${providers.length} providers`} icon={<Percent className="h-5 w-5" />} />
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl text-navy-950">Your FD cards</h2>
            <p className="mt-1 text-sm text-navy-600">Tap configure to set onboarding links. PaySprint SBM uses a runtime URL.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => {
            const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
            const staticLink = card.rail !== "PAYSPRINT_FD";
            const dimmed = !card.active;
            return (
              <div
                key={card.code}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg ${dimmed ? "opacity-80" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Sparkles className="h-5 w-5 opacity-80" />
                  <button
                    type="button"
                    role="switch"
                    aria-checked={card.active}
                    aria-label={`${cardLabel(card)} is ${card.active ? "active" : "inactive"}. Click to ${card.active ? "deactivate" : "activate"}.`}
                    className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    onClick={() => setPendingCardToggle(card)}
                  >
                    <CardStatusToggle on={card.active} />
                  </button>
                </div>
                <p className="mt-6 font-display text-2xl tracking-tight">{cardLabel(card)}</p>
                <p className="mt-1 text-xs font-medium text-white/80">{cardSubtitle(card)}</p>
                <p className="mt-4 line-clamp-2 min-h-[2.5rem] text-[11px] text-white/70">
                  {staticLink
                    ? card.apply_url
                      ? "Link configured"
                      : "No link yet — configure"
                    : "Link generated when customer opens journey"}
                </p>
                {staticLink && (
                  <button
                    type="button"
                    className="absolute bottom-4 right-4 rounded-full bg-white/20 p-2 backdrop-blur hover:bg-white/30"
                    aria-label={`Configure ${cardLabel(card)}`}
                    onClick={() => openLinkModal(card)}
                  >
                    <Settings2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl text-navy-950">Preference</h2>
            <p className="mt-1 max-w-3xl text-sm text-navy-600">
              Pick a provider and how soon it is offered. ZET is one app (SBM and IOB). NOVU is the other app: PaySprint SBM or GrowMore DCB, whichever ranks first. After a ZET link exists, only NOVU can be generated next, and the other way around.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={providers.every((provider) => rankedProviders.has(provider.code))}
            onClick={() => openRuleModal("new")}
          >
            Add rule
          </button>
        </div>
        <DataTable
          columns={["Provider", "Preference", "Cards shown", ""]}
          rows={rules.map((r) => [
            r.preferred_provider_name ?? r.preferred_provider,
            String(r.preference_rank ?? 1),
            cardsForProvider(r.preferred_provider),
            <span key={r.id} className="flex justify-end gap-3">
              <button type="button" className="text-sm font-semibold text-brand-700" onClick={() => openRuleModal(r)}>
                Edit
              </button>
              <button type="button" className="text-sm font-semibold text-rose-700" onClick={() => deleteRule(r.id)}>
                Delete
              </button>
            </span>,
          ])}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl text-navy-950">Commission</h2>
            <p className="mt-1 text-sm text-navy-600">
              Fixed rupees per converted card. Enter amount received, retailer payout, and distributor payout. Platform profit is calculated automatically.
            </p>
          </div>
        </div>
        <DataTable
          columns={["Provider", "Received ₹", "Retailer ₹", "Distributor ₹", "Platform profit ₹", ""]}
          rows={providers.map((p) => {
            const rule = p.commission_rule;
            const amounts = amountsFromRule(rule);
            const recv = moneyFrom(amounts.received);
            const ret = moneyFrom(amounts.retailer);
            const dist = moneyFrom(amounts.distributor);
            const plat = round2(recv - ret - dist);
            const configured = Boolean(rule?.id);
            return [
              p.name,
              configured ? inr(recv) : "—",
              configured ? inr(ret) : "—",
              configured ? inr(dist) : "—",
              configured ? inr(plat) : "—",
              <button
                key={`${p.code}-c`}
                type="button"
                className="text-sm font-semibold text-brand-700"
                onClick={() => openCommission(p)}
              >
                {configured ? "Edit" : "Add commission"}
              </button>,
            ];
          })}
        />
      </section>

      <Modal
        open={pendingCardToggle != null}
        title={pendingCardToggle?.active ? "Deactivate FD card" : "Activate FD card"}
        description={
          pendingCardToggle?.active
            ? "Retailers will no longer see this card in FD journeys until you activate it again."
            : "Retailers can offer this card when the provider is enabled and it is next in preference."
        }
        onClose={() => !toggleBusy && setPendingCardToggle(null)}
      >
        {pendingCardToggle && (
          <p className="text-sm font-semibold text-navy-950">{cardLabel(pendingCardToggle)}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" disabled={toggleBusy} onClick={() => setPendingCardToggle(null)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={toggleBusy} onClick={confirmCardToggle}>
            {toggleBusy
              ? "Saving…"
              : pendingCardToggle?.active
                ? "Yes, deactivate"
                : "Yes, activate"}
          </button>
        </div>
      </Modal>

      <FormModal
        open={linkCard != null}
        title={linkCard ? `Configure ${cardLabel(linkCard)}` : "Configure card"}
        description="Paste the onboarding URL from the partner. Use {ref} where the partner expects your reference id."
        onClose={() => setLinkCard(null)}
        onSubmit={saveLink}
        submitLabel="Save link"
      >
        <TextField label="Apply URL" value={linkUrl} onChange={setLinkUrl} />
      </FormModal>

      <FormModal
        open={ruleModal != null}
        title={ruleModal === "new" ? "Add provider preference" : "Edit provider preference"}
        description="Lower preference is offered first. ZET shows SBM and IOB. PaySprint shows SBM on NOVU. GrowMore shows DCB on NOVU."
        onClose={() => setRuleModal(null)}
        onSubmit={saveRule}
        submitLabel="Save preference"
      >
        <SelectField label="Provider" required value={ruleProvider} onChange={setRuleProvider} options={providerOptions} />
        <TextField label="Preference" required value={ruleRank} onChange={setRuleRank} inputMode="numeric" />
      </FormModal>

      <FormModal
        open={commissionProvider != null}
        title={hasRule ? `Edit ${commissionProvider?.name} commission` : `Add ${commissionProvider?.name} commission`}
        description="Enter the rupees you receive per card, then the fixed payout to the retailer and distributor. Platform profit is calculated automatically."
        onClose={() => setCommissionProvider(null)}
        onSubmit={saveCommission}
        submitLabel={hasRule ? "Save commission" : "Add commission"}
        submitDisabled={busy || !acknowledged || !splitValid}
      >
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
        <div>
          <p className="text-xs font-medium text-navy-500">Profit per card (platform)</p>
          <p className={`font-display text-2xl ${splitValid ? "text-navy-950" : "text-rose-700"}`}>
            {splitValid ? inr(profit) : "—"}
          </p>
          <p className="mt-1 text-xs text-navy-500">{profitHint}</p>
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
      </FormModal>
    </div>
  );
}
