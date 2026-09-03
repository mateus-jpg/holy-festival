import 'server-only';

import crypto from 'crypto';

import { admin, getAdminDb } from '@/app/lib/firebase-admin';

export async function updateProductInventory(items, { throwOnError = false } = {}) {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    for (const item of items) {
      const productRef = db.collection('shop').doc(item.itemId);
      batch.update(productRef, {
        soldCount: admin.firestore.FieldValue.increment(item.quantity),
        lastSoldAt: admin.firestore.Timestamp.now(),
      });
    }

    await batch.commit();
    console.log('Product inventory updated successfully');
  } catch (error) {
    console.error('Error updating product inventory:', error);
    if (throwOnError) {
      throw error;
    }
  }
}

export async function getTicketTemplateDocs(product) {
  const templateRefs = Array.isArray(product.products) ? product.products : [];
  if (templateRefs.length === 0) {
    throw new Error('Il prodotto non contiene riferimenti a ticket generabili');
  }

  const templateDocs = await Promise.all(templateRefs.map((ref) => ref.get()));
  if (templateDocs.some((doc) => !doc.exists || doc.data().category !== 'ticket')) {
    throw new Error('Il prodotto contiene un template ticket non valido');
  }

  return templateDocs;
}

export async function createUserProducts(orderId, userId, orderItems) {
  try {
    const db = getAdminDb();
    const pendingBatches = [];
    let batch = db.batch();
    let writesInBatch = 0;
    const createdTickets = [];
    const batchSet = (ref, data, options) => {
      if (writesInBatch >= 450) {
        pendingBatches.push(batch);
        batch = db.batch();
        writesInBatch = 0;
      }

      if (options) {
        batch.set(ref, data, options);
      } else {
        batch.set(ref, data);
      }
      writesInBatch += 1;
    };

    for (const item of orderItems) {
      const productDoc = await db.collection('shop').doc(item.itemId).get();

      if (!productDoc.exists) {
        console.error(`Shop Item ${item.itemId} not found`);
        continue;
      }

      const product = productDoc.data();

      if (!Array.isArray(product.products) || product.products.length === 0) {
        console.error(`Shop Item ${item.itemId} has no product references`);
        continue;
      }

      const productRefs = await getTicketTemplateDocs(product);

      for (let i = 0; i < item.quantity; i++) {
        await createTicketUserProduct(
          db,
          batchSet,
          orderId,
          userId,
          productRefs,
          i + 1,
          createdTickets
        );
      }
    }

    if (writesInBatch > 0) {
      pendingBatches.push(batch);
    }
    for (const pendingBatch of pendingBatches) {
      await pendingBatch.commit();
    }
    console.log(`Created user products for order ${orderId}`);
    return createdTickets;
  } catch (error) {
    console.error('Error creating user products:', error);
    throw error;
  }
}

async function createTicketUserProduct(
  db,
  batchSet,
  orderId,
  userId,
  productRefs,
  sequence,
  createdTickets
) {
  const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let subsequence = 0;

  for (const productDoc of productRefs) {
    if (!productDoc.exists) {
      console.error(`Referenced product ${productDoc.id} not found`);
      continue;
    }

    const productData = productDoc.data();
    const orderSlice = orderId.slice(-6).toUpperCase();
    const userProductId = `USRPRD-${orderSlice}-${productDoc.id}-${dateString}${sequence}${subsequence}`;
    const productRef = db.collection('userProducts').doc(userId).collection('products').doc(userProductId);
    const validationSecret = generateValidationSecret();

    if (productData.category === 'ticket') {
      const ticketNumber = createStableTicketNumber(orderId, userId, productDoc.id, dateString, sequence, subsequence);
      const ticketRef = db.collection('tickets').doc(ticketNumber);

      batchSet(ticketRef, {
        userId,
        orderId,
        name: productData.name,
        description: productData.description || null,
        price: Number.isFinite(Number(productData.price)) ? Number(productData.price) : null,
        userProductIdRef: userProductId,
        status: 'active',
        validationSecret,
        valid: true,
        ticketNumberRef: ticketNumber,
        ticketId: productDoc.id,
        imgUrl: productData.imgUrl || null,
        validFrom: productData.validFrom,
        validUntil: productData.validUntil,
        eventId: productData.eventId,
        location: productData.location || null,
        category: productData.category,
      });

      batchSet(productRef, {
        userId,
        orderId,
        userProductIdRef: userProductId,
        status: 'active',
        validationSecret,
        valid: true,
        ticketNumberRef: ticketNumber,
        productIdRef: productDoc.id,
        name: productData.name,
        description: productData.description || null,
        price: Number.isFinite(Number(productData.price)) ? Number(productData.price) : null,
        validFrom: productData.validFrom,
        validUntil: productData.validUntil,
        eventId: productData.eventId,
        location: productData.location || null,
        category: productData.category,
      });

      createdTickets.push({
        id: ticketNumber,
        name: productData.name,
        ticketId: productDoc.id,
        userProductId,
      });
    } else {
      batchSet(productRef, {
        userId,
        orderId,
        userProductIdRef: userProductId,
        productIdRef: productDoc.id,
        status: 'active',
        validationSecret,
        valid: true,
        eventId: productData.eventId,
        category: productData.category,
      });
    }

    subsequence++;
  }
}

function generateValidationSecret() {
  return `vld_${crypto.randomBytes(12).toString('hex')}`;
}

function createStableTicketNumber(orderId, userId, productId, dateString, sequence, subsequence) {
  const orderSlice = orderId.slice(-6).toUpperCase();
  const digest = crypto
    .createHash('sha256')
    .update(`${orderId}:${userId}:${productId}:${sequence}:${subsequence}`)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();

  return `TCKT-${orderSlice}-${productId}-${dateString}${sequence}${subsequence}-${digest}`;
}
