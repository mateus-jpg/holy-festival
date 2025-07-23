import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  address: z.object({
    line1: z.string().min(1, 'Address is required').max(200),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(2, 'State is required').max(50),
    postal_code: z.string().min(5, 'ZIP code is required').max(10),
    country: z.string().length(2, 'Invalid country code').default('US'),
  }),
});


export const profileSchema = z.object({
  name: z.string().min(2, 'Il nome è richiesto'),
  surname: z.string().min(2, 'Il cognome è richiesto'),
  codiceFiscale: z.string().refine(validateCodiceFiscale, {
    message: 'Codice fiscale non valido',
  }),
});
export const cartItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  price: z.number().min(0.01).max(100000),
  quantity: z.number().int().min(1).max(100),
});

export const paymentIntentSchema = z.object({
  amount: z.number().int().min(50).max(100000000), // $0.50 to $1M
  currency: z.string().length(3).default('usd'),
  items: z.array(cartItemSchema).min(1).max(50),
});
