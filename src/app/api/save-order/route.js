// src/app/api/save-order/route.js
import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      paymentIntentId, 
      customerInfo, 
      items, 
      total, 
      status 
    } = body;

    // Validate required fields
    if (!paymentIntentId || !customerInfo || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment intent with Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid payment intent' },
        { status: 400 }
      );
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Create order object
    const order = {
      paymentIntentId,
      stripePaymentId: paymentIntent.id,
      customer: {
        userId: customerInfo.userId,
        name: customerInfo.name,
        email: customerInfo.email,
        address: customerInfo.address,
      },
      items: items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      pricing: {
        subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        tax: items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.08,
        total: total,
      },
      status: status || 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'orders'), order);

    // TODO: Send confirmation email
    // TODO: Update product inventory
    // TODO: Trigger fulfillment process

    return NextResponse.json({
      success: true,
      orderId: docRef.id,
    });

  } catch (error) {
    console.error('Order save failed:', error);
    return NextResponse.json(
      { error: 'Failed to save order' },
      { status: 500 }
    );
  }
}