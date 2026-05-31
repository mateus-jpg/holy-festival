import { AppConfig } from '@/app/lib/config';

export function itemHasFees(item) {
  return Boolean(item?.withFees || item?.withFee);
}

export function calculateCartTotals(items, config = AppConfig) {
  const subtotal = items.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const feeSubtotal = items
    .filter(itemHasFees)
    .reduce(
      (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );

  const tax = subtotal * config.TAX_RATE;
  const taxOnFeeItems = subtotal > 0 ? (feeSubtotal / subtotal) * tax : 0;
  const feeBase = feeSubtotal + taxOnFeeItems;
  const fees = feeSubtotal > 0
    ? feeBase * config.TRANSACTION_RATE + config.TRANSACTION_FEE
    : 0;
  const total = subtotal + tax + fees;

  return {
    subtotal,
    feeSubtotal,
    tax,
    fees,
    total,
    subtotalCents: Math.round(subtotal * 100),
    taxCents: Math.round(tax * 100),
    feesCents: Math.round(fees * 100),
    totalCents: Math.round(total * 100),
  };
}
