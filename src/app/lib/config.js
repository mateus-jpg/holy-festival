export const AppConfig = {
  TAX_RATE: Number(process.env.NEXT_PUBLIC_TAX_RATE),
  TRANSACTION_FEE:  Number(process.env.NEXT_PUBLIC_TRANSACTION_FEE),
  TRANSACTION_RATE:  Number(process.env.NEXT_PUBLIC_TRANSACTION_RATE),
  CURRENCY: process.env.NEXT_PUBLIC_CURRENCY,
  MIN_AMOUNT: Number(process.env.NEXT_PUBLIC_MIN_AMOUNT),
};