import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
// Add these imports to use Firestore
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '@/app/lib/firebase';


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');
    console.log("Recevide call on stripe Endpoint")
    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);

    // 1. Extract metadata and details from the paymentIntent
    const { metadata } = paymentIntent;
    const items = JSON.parse(metadata.orderItems || '[]');
    const total = paymentIntent.amount / 100; // Convert from cents to dollars

    console.log(paymentIntent)
    // Note: You may want to add customerId to metadata when creating the payment intent
    // to link the order to a specific user.
    const customerId = metadata.userId || 'guest'; 
    const customerDetails = paymentIntent.shipping || { name: 'Guest', address: {} };

    // 2. Create the order object to be saved
    const order = {
      paymentIntentId: paymentIntent.id,
      customerId: customerId,
      customerName: customerDetails.name,
      customerEmail: paymentIntent.receipt_email,
      items: items,
      total: total,
      currency: paymentIntent.currency,
      status: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 3. Save the order to Firestore
    const docRef = await addDoc(collection(db, 'orders'), order);
    console.log('Order saved to Firestore with ID:', docRef.id);
    
  } catch (error) {
    console.error('Error handling payment success and saving order:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    console.log('Payment failed:', paymentIntent.id);
    
    // Optional: You could create an order with a "failed" status here
    // Or send a notification to the user.
    // For now, we'll just log it.
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}