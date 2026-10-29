import { inr } from "@/lib/format";

export type HospiOffer = {
  sellingPrice: number;
  discount: number;
  payable: number;
};

export function hospiMoney(offer: HospiOffer | null | undefined) {
  const sellingPrice = Number(offer?.sellingPrice ?? 1000);
  const discount = Number(offer?.discount ?? 0);
  const payable = Number(offer?.payable ?? sellingPrice - discount);
  return { sellingPrice, discount, payable };
}

export function hospiCollectLine(offer: HospiOffer | null | undefined) {
  const { sellingPrice, discount, payable } = hospiMoney(offer);
  if (discount > 0) {
    return `Selling price ${inr(sellingPrice)}. Discount ${inr(discount)}. Collect ${inr(payable)}.`;
  }
  return `Collect ${inr(payable)}.`;
}
