import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { AppConfig } from '@/app/lib/config';
import { admin, getAdminAuth, getAdminDb } from '@/app/lib/firebase-admin';
import { getProduct } from '@/app/lib/products';
import { verifyAdminRequest } from '@/app/lib/server-auth';
import { createUserProducts, updateProductInventory } from '@/app/lib/ticket-fulfillment';

export const runtime = 'nodejs';

function jsonError(error, status) {
  return NextResponse.json({ error }, { status });
}

function getAvailableStock(product) {
  const availableStock = Number(product.availableStock);
  if (Number.isFinite(availableStock)) {
    return availableStock;
  }

  const totalStock = Number(product.totalStock);
  const soldCount = Number(product.soldCount || 0);
  if (Number.isFinite(totalStock)) {
    return Math.max(totalStock - soldCount, 0);
  }

  return null;
}

function serializeProduct(doc) {
  const product = doc.data();
  return {
    id: doc.id,
    name: product.name || doc.id,
    description: product.description || '',
    category: product.category || '',
    price: Number(product.price || 0),
    isActive: product.isActive !== false,
    availableStock: getAvailableStock(product),
    totalStock: Number.isFinite(Number(product.totalStock)) ? Number(product.totalStock) : null,
    soldCount: Number.isFinite(Number(product.soldCount)) ? Number(product.soldCount) : 0,
  };
}

function serializeUser(doc) {
  const user = doc.data();
  return {
    uid: doc.id,
    email: user.email || '',
    name: user.name || '',
    surname: user.surname || '',
    displayName: user.displayName || '',
  };
}

async function resolveTargetUser({ userId, userEmail }) {
  const db = getAdminDb();
  const auth = getAdminAuth();
  const trimmedUserId = String(userId || '').trim();
  const trimmedEmail = String(userEmail || '').trim();

  if (trimmedUserId) {
    const userRef = db.collection('users').doc(trimmedUserId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return { uid: trimmedUserId, ...userDoc.data() };
    }

    const authUser = await auth.getUser(trimmedUserId);
    const newUser = {
      email: authUser.email || '',
      displayName: authUser.displayName || null,
      photoURL: authUser.photoURL || null,
      emailVerified: authUser.emailVerified || false,
      isAdmin: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };
    await userRef.set(newUser, { merge: true });
    return { uid: trimmedUserId, ...newUser };
  }

  if (!trimmedEmail) {
    throw Object.assign(new Error('Seleziona un utente o inserisci un indirizzo email'), { status: 400 });
  }

  const usersByEmail = await db.collection('users').where('email', '==', trimmedEmail).limit(1).get();
  if (!usersByEmail.empty) {
    const userDoc = usersByEmail.docs[0];
    return { uid: userDoc.id, ...userDoc.data() };
  }

  const authUser = await auth.getUserByEmail(trimmedEmail);
  const userRef = db.collection('users').doc(authUser.uid);
  const newUser = {
    email: authUser.email || trimmedEmail,
    displayName: authUser.displayName || null,
    photoURL: authUser.photoURL || null,
    emailVerified: authUser.emailVerified || false,
    isAdmin: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };
  await userRef.set(newUser, { merge: true });
  return { uid: authUser.uid, ...newUser };
}

async function getAdminOrResponse(request) {
  const adminRequest = await verifyAdminRequest(request);
  if (adminRequest.error) {
    return {
      response: jsonError(adminRequest.error, adminRequest.status),
    };
  }

  return { adminRequest };
}

export async function GET(request) {
  const { adminRequest, response } = await getAdminOrResponse(request);
  if (response) {
    return response;
  }

  const db = getAdminDb();
  const [productsSnap, usersSnap] = await Promise.all([
    db.collection('shop').where('isActive', '==', true).get(),
    db.collection('users').limit(250).get(),
  ]);

  return NextResponse.json({
    admin: {
      uid: adminRequest.decodedToken.uid,
    },
    products: productsSnap.docs.map(serializeProduct),
    users: usersSnap.docs.map(serializeUser).filter((user) => user.email || user.name || user.displayName),
  });
}

export async function POST(request) {
  const { adminRequest, response } = await getAdminOrResponse(request);
  if (response) {
    return response;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const productId = String(body.productId || '').trim();
  const quantity = Number(body.quantity || 1);
  const consumeInventory = body.consumeInventory !== false;
  const note = String(body.note || '').trim();

  if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return jsonError('Dati biglietto non validi', 400);
  }

  let targetUser;
  try {
    targetUser = await resolveTargetUser({
      userId: body.userId,
      userEmail: body.userEmail,
    });
  } catch (error) {
    return jsonError(error.message || 'Utente non trovato', error.status || 404);
  }

  let product;
  try {
    product = await getProduct(productId);
  } catch (error) {
    return jsonError('Biglietto non trovato', error.status || 404);
  }

  if (product.isActive === false) {
    return jsonError('Questo biglietto non è attivo', 400);
  }

  if (!Array.isArray(product.products) || product.products.length === 0) {
    return jsonError('Questo prodotto non contiene riferimenti a biglietti generabili', 400);
  }

  const availableStock = getAvailableStock(product);
  if (consumeInventory && availableStock !== null && quantity > availableStock) {
    return jsonError('Disponibilità insufficiente per generare questi biglietti', 400);
  }

  const db = getAdminDb();
  const now = admin.firestore.Timestamp.now();
  const orderId = `manual_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const productPrice = Number(product.price || 0);
  const orderItems = [
    {
      itemId: product.id,
      name: product.name || product.id,
      category: product.category || '',
      price: productPrice,
      quantity,
      withFees: false,
      manual: true,
    },
  ];
  const orderRef = db.collection('orders').doc(orderId);

  await orderRef.set({
    orderId,
    userId: targetUser.uid,
    generatedBy: adminRequest.decodedToken.uid,
    processStatus: 'completed',
    paymentStatus: 'manual',
    fulfillmentStatus: 'processing',
    amount: 0,
    waivedAmount: Math.round(productPrice * quantity * 100),
    currency: AppConfig.CURRENCY.toUpperCase(),
    subtotal: 0,
    tax: 0,
    fees: 0,
    items: orderItems,
    itemCount: quantity,
    source: 'admin_manual',
    note,
    consumeInventory,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
  });

  try {
    const tickets = await createUserProducts(orderId, targetUser.uid, orderItems);
    if (consumeInventory) {
      await updateProductInventory(orderItems, { throwOnError: true });
    }

    await orderRef.set(
      {
        fulfillmentStatus: 'fulfilled',
        fulfilledAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      orderId,
      user: {
        uid: targetUser.uid,
        email: targetUser.email || '',
        name: targetUser.name || '',
        surname: targetUser.surname || '',
        displayName: targetUser.displayName || '',
      },
      tickets,
    });
  } catch (error) {
    await orderRef.set(
      {
        fulfillmentStatus: 'failed',
        fulfillmentError: error.message,
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    console.error('Manual ticket generation failed:', error);
    return jsonError('Generazione biglietti non riuscita', 500);
  }
}
