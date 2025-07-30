// src/app/api/webhooks/stripe/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_KEY
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

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Processing successful payment:', paymentIntent.id);

    // Extract metadata
    const { userId, orderItems, itemCount } = paymentIntent.metadata;

    if (!userId || !orderItems) {
      console.error('Missing required metadata in payment intent');
      return;
    }

    // Parse order items
    let parsedItems;
    try {
      parsedItems = JSON.parse(orderItems);
    } catch (error) {
      console.error('Failed to parse order items:', error);
      return;
    }

    // Create order document with process status
    const orderData = {
      // Order identification
      orderId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      userId: userId,

      // Process status - can be: 'pending', 'processing', 'completed', 'failed', 'cancelled'
      processStatus: 'completed',
      paymentStatus: paymentIntent.status,

      // Payment details
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),

      // Order items
      items: parsedItems,
      itemCount: parseInt(itemCount),

      // Timestamps
      createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
      updatedAt: admin.firestore.Timestamp.now(),
      completedAt: admin.firestore.Timestamp.now(),

      // Payment method info
      paymentMethodId: paymentIntent.payment_method,
      paymentMethodTypes: paymentIntent.payment_method_types,

      // Additional Stripe data
      stripeData: {
        clientSecret: paymentIntent.client_secret,
        latestCharge: paymentIntent.latest_charge,
        receiptEmail: paymentIntent.receipt_email,
        livemode: paymentIntent.livemode
      }
    };

    // Store order in single orders collection
    const orderRef = db.collection('orders').doc(paymentIntent.id);
    await orderRef.set(orderData);

    console.log(`Order ${paymentIntent.id} successfully stored with status 'completed' for user ${userId}`);

    // Optional: Update product inventory
    await updateProductInventory(parsedItems);

  } catch (error) {
    console.error('Error handling successful payment:', error);
    // Store order with failed process status
    await storeFailedOrder(paymentIntent, 'processing_error', error.message);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Processing failed payment:', paymentIntent.id);

    const { userId, orderItems, itemCount } = paymentIntent.metadata;

    if (!userId) {
      console.error('Missing userId in failed payment metadata');
      return;
    }

    let parsedItems = [];
    try {
      parsedItems = JSON.parse(orderItems || '[]');
    } catch (error) {
      console.error('Failed to parse order items in failed payment:', error);
    }

    // Store failed order in same collection with process status
    const failedOrderData = {
      orderId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      userId: userId,

      // Process status for failed payments
      processStatus: 'failed',
      paymentStatus: paymentIntent.status,

      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      items: parsedItems,
      itemCount: parseInt(itemCount || '0'),

      failureReason: paymentIntent.last_payment_error?.message || 'Unknown payment error',

      createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
      updatedAt: admin.firestore.Timestamp.now(),
      failedAt: admin.firestore.Timestamp.now(),

      stripeData: {
        lastPaymentError: paymentIntent.last_payment_error,
        livemode: paymentIntent.livemode
      }
    };

    // Store in same orders collection
    const orderRef = db.collection('orders').doc(paymentIntent.id);
    await orderRef.set(failedOrderData);

    console.log(`Failed payment ${paymentIntent.id} stored with status 'failed' for user ${userId}`);

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent) {
  try {
    console.log('Processing payment that requires action:', paymentIntent.id);

    const { userId, orderItems, itemCount } = paymentIntent.metadata;

    if (!userId) {
      console.error('Missing userId in payment requires action metadata');
      return;
    }

    let parsedItems = [];
    try {
      parsedItems = JSON.parse(orderItems || '[]');
    } catch (error) {
      console.error('Failed to parse order items in requires action payment:', error);
    }

    // Get action type from next_action
    const actionType = paymentIntent.next_action?.type || 'unknown';
    const actionData = paymentIntent.next_action || {};

    // Create/update order with pending status
    const pendingOrderData = {
      orderId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      userId: userId,

      // Process status for payments requiring action
      processStatus: 'pending',
      paymentStatus: paymentIntent.status, // 'requires_action'

      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      items: parsedItems,
      itemCount: parseInt(itemCount || '0'),

      // Action details
      requiresAction: true,
      actionType: actionType, // 'use_stripe_sdk', 'redirect_to_url', etc.
      actionData: actionData,

      createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
      updatedAt: admin.firestore.Timestamp.now(),
      pendingAt: admin.firestore.Timestamp.now(),

      // Payment method info
      paymentMethodId: paymentIntent.payment_method,
      paymentMethodTypes: paymentIntent.payment_method_types,

      stripeData: {
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
        livemode: paymentIntent.livemode
      }
    };

    // Store/update order in orders collection
    const orderRef = db.collection('orders').doc(paymentIntent.id);

    // Check if order already exists to preserve creation timestamp
    const existingOrder = await orderRef.get();
    if (existingOrder.exists) {
      // Update existing order, preserve createdAt
      await orderRef.update({
        processStatus: 'pending',
        paymentStatus: paymentIntent.status,
        requiresAction: true,
        actionType: actionType,
        actionData: actionData,
        updatedAt: admin.firestore.Timestamp.now(),
        pendingAt: admin.firestore.Timestamp.now(),
        stripeData: pendingOrderData.stripeData
      });
      console.log(`Updated existing order ${paymentIntent.id} with 'pending' status - requires ${actionType}`);
    } else {
      // Create new order
      await orderRef.set(pendingOrderData);
      console.log(`Created new order ${paymentIntent.id} with 'pending' status - requires ${actionType}`);
    }

  } catch (error) {
    console.error('Error handling payment requires action:', error);
    // Store order with error status
    await storeFailedOrder(paymentIntent, 'processing_error', `Requires action processing error: ${error.message}`);
  }
}

async function storeFailedOrder(paymentIntent, processStatus, errorMessage) {
  try {
    const { userId, orderItems, itemCount } = paymentIntent.metadata;

    let parsedItems = [];
    try {
      parsedItems = JSON.parse(orderItems || '[]');
    } catch (error) {
      console.error('Failed to parse order items:', error);
    }

    const errorOrderData = {
      orderId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      userId: userId || 'unknown',

      processStatus: processStatus, // 'processing_error', 'failed', etc.
      paymentStatus: paymentIntent.status,

      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      items: parsedItems,
      itemCount: parseInt(itemCount || '0'),

      errorMessage: errorMessage,

      createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
      updatedAt: admin.firestore.Timestamp.now(),
      errorAt: admin.firestore.Timestamp.now(),
    };

    await db.collection('orders').doc(paymentIntent.id).set(errorOrderData);
    console.log(`Error order ${paymentIntent.id} stored with status '${processStatus}'`);

  } catch (error) {
    console.error('Failed to store error order:', error);
  }
}

async function updateProductInventory(items) {
  try {
    const batch = db.batch();

    for (const item of items) {
      const productRef = db.collection('shop').doc(item.id);
      batch.update(productRef, {
        soldCount: admin.firestore.FieldValue.increment(item.quantity),
        lastSoldAt: admin.firestore.Timestamp.now()
      });
    }

    await batch.commit();
    console.log('Product inventory updated successfully');

  } catch (error) {
    console.error('Error updating product inventory:', error);
    // Don't throw - inventory update failure shouldn't fail the webhook
  }
}