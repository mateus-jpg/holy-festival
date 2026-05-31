function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const AppConfig = {
  TAX_RATE: numberFromEnv(process.env.NEXT_PUBLIC_TAX_RATE, 0),
  TRANSACTION_FEE: numberFromEnv(process.env.NEXT_PUBLIC_TRANSACTION_FEE, 0),
  TRANSACTION_RATE: numberFromEnv(process.env.NEXT_PUBLIC_TRANSACTION_RATE, 0),
  CURRENCY: (process.env.NEXT_PUBLIC_CURRENCY || 'eur').toLowerCase(),
  MIN_AMOUNT: numberFromEnv(process.env.NEXT_PUBLIC_MIN_AMOUNT, 0.5),
};
