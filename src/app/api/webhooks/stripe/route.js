// src/app/api/webhooks/stripe/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  handlePaymentIntentSucceeded, 
  handlePaymentIntentFailed,
  handlePaymentIntentRequiresAction,
  
 } from '@/app/api/webhooks/stripe/paymentHandlers'

export const runtime = 'nodejs';

export async function POST(request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookKey = process.env.STRIPE_WEBHOOK_KEY;

  if (!stripeKey || !webhookKey) {
    return NextResponse.json(
      { error: 'Stripe webhook configuration error' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();
  
  const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookKey
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
