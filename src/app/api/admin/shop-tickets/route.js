import { NextResponse } from 'next/server';

import { admin, getAdminDb } from '@/app/lib/firebase-admin';
import { verifyAdminRequest } from '@/app/lib/server-auth';

export const runtime = 'nodejs';

function jsonError(error, status) {
  return NextResponse.json({ error }, { status });
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

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function dateOrNull(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return admin.firestore.Timestamp.fromDate(date);
}

function serializeTimestamp(value) {
  if (!value) {
    return '';
  }

  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 16);
}

function getAvailableStock(product) {
  const availableStock = Number(product.availableStock);
  if (product.availableStock !== null && product.availableStock !== undefined && product.availableStock !== '' && Number.isFinite(availableStock)) {
    return availableStock;
  }

  const totalStock = Number(product.totalStock);
  const soldCount = Number(product.soldCount || 0);
  if (product.totalStock !== null && product.totalStock !== undefined && product.totalStock !== '' && Number.isFinite(totalStock)) {
    return Math.max(totalStock - soldCount, 0);
  }

  return null;
}

async function serializeShopTicket(doc) {
  const product = doc.data();
  const templateRefs = Array.isArray(product.products) ? product.products : [];
  const templateSnaps = await Promise.all(
    templateRefs.map(async (ref) => {
      try {
        return await ref.get();
      } catch {
        return null;
      }
    })
  );
  const templates = templateSnaps
    .filter((snap) => snap?.exists)
    .map((snap) => {
      const template = snap.data();
      return {
        id: snap.id,
        path: snap.ref.path,
        name: template.name || '',
        description: template.description || '',
        eventId: template.eventId || '',
        location: template.location || '',
        imgUrl: template.imgUrl || '',
        validFrom: serializeTimestamp(template.validFrom),
        validUntil: serializeTimestamp(template.validUntil),
      };
    });

  return {
    id: doc.id,
    productType: product.productType === 'bundle' || templates.length > 1 ? 'bundle' : 'single',
    componentProductIds: Array.isArray(product.componentProductIds) ? product.componentProductIds : [],
    componentCount: templates.length,
    name: product.name || '',
    description: product.description || '',
    category: product.category || 'tickets',
    price: Number(product.price || 0),
    totalStock: product.totalStock !== null && product.totalStock !== undefined && product.totalStock !== '' && Number.isFinite(Number(product.totalStock)) ? Number(product.totalStock) : '',
    soldCount: Number.isFinite(Number(product.soldCount)) ? Number(product.soldCount) : 0,
    availableStock: getAvailableStock(product),
    isActive: product.isActive !== false,
    withFees: Boolean(product.withFees || product.withFee),
    imgUrl: product.imgUrl || templates[0]?.imgUrl || '',
    validFrom: serializeTimestamp(product.validFrom) || templates[0]?.validFrom || '',
    validUntil: serializeTimestamp(product.validUntil) || templates[0]?.validUntil || '',
    eventId: product.eventId || templates[0]?.eventId || '',
    location: product.location || templates[0]?.location || '',
    templatePath: templates[0]?.path || '',
    templates,
    createdAt: serializeTimestamp(product.createdAt),
    updatedAt: serializeTimestamp(product.updatedAt),
  };
}

function buildTicketPayload(body) {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);
  const totalStock = body.totalStock === '' || body.totalStock === null || body.totalStock === undefined
    ? null
    : Number(body.totalStock);
  const validFrom = dateOrNull(body.validFrom);
  const validUntil = dateOrNull(body.validUntil);

  if (!name) {
    throw Object.assign(new Error('Il nome è richiesto'), { status: 400 });
  }

  if (!Number.isFinite(price) || price < 0) {
    throw Object.assign(new Error('Prezzo non valido'), { status: 400 });
  }

  if (totalStock !== null && (!Number.isInteger(totalStock) || totalStock < 0)) {
    throw Object.assign(new Error('Disponibilità non valida'), { status: 400 });
  }

  if (validFrom && validUntil && validFrom.toMillis() > validUntil.toMillis()) {
    throw Object.assign(new Error('La data di inizio validità deve precedere la fine'), { status: 400 });
  }

  return {
    name,
    description,
    price,
    totalStock,
    validFrom,
    validUntil,
    imgUrl: String(body.imgUrl || '').trim(),
    eventId: String(body.eventId || '').trim() || 'holy-festival-2026',
    location: String(body.location || '').trim(),
    withFees: body.withFees !== false,
    isActive: body.isActive !== false,
    productType: body.productType === 'bundle' ? 'bundle' : 'single',
    componentProductIds: Array.isArray(body.componentProductIds)
      ? [...new Set(body.componentProductIds.map((id) => String(id || '').trim()).filter(Boolean))]
      : [],
  };
}

async function resolveBundleTemplates(db, componentProductIds) {
  if (componentProductIds.length < 2) {
    throw Object.assign(new Error('Seleziona almeno due biglietti singoli per creare un pacchetto'), { status: 400 });
  }

  const componentDocs = await Promise.all(
    componentProductIds.map((productId) => db.collection('shop').doc(productId).get())
  );

  if (componentDocs.some((doc) => !doc.exists)) {
    throw Object.assign(new Error('Uno dei biglietti scelti non esiste più'), { status: 400 });
  }

  if (componentDocs.some((doc) => doc.data().isActive === false)) {
    throw Object.assign(new Error('I componenti di un pacchetto devono essere attivi'), { status: 400 });
  }

  if (componentDocs.some((doc) => doc.data().productType === 'bundle')) {
    throw Object.assign(new Error('Non puoi inserire un pacchetto dentro un altro pacchetto'), { status: 400 });
  }

  const templateRefs = componentDocs.flatMap((doc) => {
    const refs = doc.data().products;
    return Array.isArray(refs) ? refs : [];
  });
  const uniqueTemplateRefs = [...new Map(templateRefs.map((ref) => [ref.path, ref])).values()];

  if (uniqueTemplateRefs.length !== componentProductIds.length) {
    throw Object.assign(new Error('Ogni componente deve contenere un solo ticket generabile'), { status: 400 });
  }

  const templateDocs = await Promise.all(uniqueTemplateRefs.map((ref) => ref.get()));
  if (templateDocs.some((doc) => !doc.exists || doc.data().category !== 'ticket')) {
    throw Object.assign(new Error('Uno dei componenti non contiene un template ticket valido'), { status: 400 });
  }

  const eventIds = [...new Set(templateDocs.map((doc) => String(doc.data().eventId || '').trim()).filter(Boolean))];
  if (eventIds.length > 1) {
    throw Object.assign(new Error('Tutti i componenti devono appartenere allo stesso evento'), { status: 400 });
  }

  const locations = [...new Set(templateDocs.map((doc) => String(doc.data().location || '').trim()).filter(Boolean))];
  const validFromValues = templateDocs.map((doc) => doc.data().validFrom).filter(Boolean);
  const validUntilValues = templateDocs.map((doc) => doc.data().validUntil).filter(Boolean);

  return {
    templateRefs: uniqueTemplateRefs,
    eventId: eventIds[0] || '',
    location: locations.length === 1 ? locations[0] : '',
    validFrom: validFromValues.length
      ? validFromValues.reduce((earliest, value) => (value.toMillis() < earliest.toMillis() ? value : earliest))
      : null,
    validUntil: validUntilValues.length
      ? validUntilValues.reduce((latest, value) => (value.toMillis() > latest.toMillis() ? value : latest))
      : null,
  };
}

export async function GET(request) {
  const { response } = await getAdminOrResponse(request);
  if (response) {
    return response;
  }

  const db = getAdminDb();
  const snapshot = await db.collection('shop').get();
  const tickets = await Promise.all(snapshot.docs.map(serializeShopTicket));

  return NextResponse.json({
    tickets: tickets.sort((a, b) => a.name.localeCompare(b.name)),
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

  let payload;
  try {
    payload = buildTicketPayload(body);
  } catch (error) {
    return jsonError(error.message, error.status || 400);
  }

  const db = getAdminDb();
  const now = admin.firestore.Timestamp.now();
  const baseId = slugify(body.id || payload.name) || `ticket-${Date.now()}`;
  let productRef = db.collection('shop').doc(baseId);
  let suffix = 1;

  while ((await productRef.get()).exists) {
    productRef = db.collection('shop').doc(`${baseId}-${suffix}`);
    suffix += 1;
  }

  let templateRefs;
  if (payload.productType === 'bundle') {
    try {
      const bundleMetadata = await resolveBundleTemplates(db, payload.componentProductIds);
      templateRefs = bundleMetadata.templateRefs;
      payload.eventId = bundleMetadata.eventId || payload.eventId;
      payload.location = bundleMetadata.location || payload.location;
      payload.validFrom = bundleMetadata.validFrom;
      payload.validUntil = bundleMetadata.validUntil;
    } catch (error) {
      return jsonError(error.message, error.status || 400);
    }
  } else {
    templateRefs = [db.collection('products').doc(productRef.id + '-ticket')];
  }

  const templateData = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    imgUrl: payload.imgUrl || null,
    validFrom: payload.validFrom,
    validUntil: payload.validUntil,
    eventId: payload.eventId,
    location: payload.location,
    category: 'ticket',
    createdAt: now,
    updatedAt: now,
    createdBy: adminRequest.decodedToken.uid,
  };
  const productData = {
    name: payload.name,
    description: payload.description,
    category: 'tickets',
    price: payload.price,
    imgUrl: payload.imgUrl || null,
    isActive: payload.isActive,
    withFees: payload.withFees,
    totalStock: payload.totalStock,
    soldCount: 0,
    products: templateRefs,
    productType: payload.productType,
    componentProductIds: payload.productType === 'bundle' ? payload.componentProductIds : [],
    validFrom: payload.validFrom,
    validUntil: payload.validUntil,
    eventId: payload.eventId,
    location: payload.location,
    createdAt: now,
    updatedAt: now,
    createdBy: adminRequest.decodedToken.uid,
  };

  await db.runTransaction(async (transaction) => {
    if (payload.productType === 'single') {
      transaction.set(templateRefs[0], templateData);
    }
    transaction.set(productRef, productData);
  });

  const created = await productRef.get();
  return NextResponse.json({
    success: true,
    ticket: await serializeShopTicket(created),
  });
}

export async function PATCH(request) {
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

  const productId = String(body.id || '').trim();
  if (!productId) {
    return jsonError('ID biglietto mancante', 400);
  }

  let payload;
  try {
    payload = buildTicketPayload(body);
  } catch (error) {
    return jsonError(error.message, error.status || 400);
  }

  const db = getAdminDb();
  const productRef = db.collection('shop').doc(productId);
  const productSnap = await productRef.get();
  if (!productSnap.exists) {
    return jsonError('Biglietto non trovato', 404);
  }

  const product = productSnap.data();
  const existingTemplateRefs = Array.isArray(product.products) ? product.products : [];
  const existingProductType = product.productType === 'bundle' || existingTemplateRefs.length > 1 ? 'bundle' : 'single';
  if (payload.productType !== existingProductType) {
    return jsonError('Il tipo di prodotto non può essere cambiato in modifica: crea un nuovo prodotto', 400);
  }

  let templateRefs = existingTemplateRefs;
  let templateRef = templateRefs[0] || db.collection('products').doc(`${productId}-ticket`);
  if (payload.productType === 'bundle') {
    try {
      const bundleMetadata = await resolveBundleTemplates(db, payload.componentProductIds);
      templateRefs = bundleMetadata.templateRefs;
      payload.eventId = bundleMetadata.eventId || payload.eventId;
      payload.location = bundleMetadata.location || payload.location;
      payload.validFrom = bundleMetadata.validFrom;
      payload.validUntil = bundleMetadata.validUntil;
      templateRef = templateRefs[0];
    } catch (error) {
      return jsonError(error.message, error.status || 400);
    }
  }
  const now = admin.firestore.Timestamp.now();

  await db.runTransaction(async (transaction) => {
    if (payload.productType === 'single') {
      transaction.set(
        templateRef,
        {
          name: payload.name,
          description: payload.description,
          price: payload.price,
          imgUrl: payload.imgUrl || null,
          validFrom: payload.validFrom,
          validUntil: payload.validUntil,
          eventId: payload.eventId,
          location: payload.location,
          category: 'ticket',
          updatedAt: now,
          updatedBy: adminRequest.decodedToken.uid,
        },
        { merge: true }
      );
    }

    transaction.set(
      productRef,
      {
        name: payload.name,
        description: payload.description,
        category: 'tickets',
        price: payload.price,
        imgUrl: payload.imgUrl || null,
        isActive: payload.isActive,
        withFees: payload.withFees,
        totalStock: payload.totalStock,
        products: templateRefs.length ? templateRefs : [templateRef],
        productType: payload.productType,
        componentProductIds: payload.productType === 'bundle' ? payload.componentProductIds : [],
        validFrom: payload.validFrom,
        validUntil: payload.validUntil,
        eventId: payload.eventId,
        location: payload.location,
        updatedAt: now,
        updatedBy: adminRequest.decodedToken.uid,
      },
      { merge: true }
    );
  });

  const updated = await productRef.get();
  return NextResponse.json({
    success: true,
    ticket: await serializeShopTicket(updated),
  });
}

export async function DELETE(request) {
  const { adminRequest, response } = await getAdminOrResponse(request);
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const productId = String(searchParams.get('id') || '').trim();
  if (!productId) {
    return jsonError('ID biglietto mancante', 400);
  }

  const db = getAdminDb();
  const productRef = db.collection('shop').doc(productId);
  const productSnap = await productRef.get();
  if (!productSnap.exists) {
    return jsonError('Biglietto non trovato', 404);
  }

  await productRef.set(
    {
      isActive: false,
      deletedAt: admin.firestore.Timestamp.now(),
      deletedBy: adminRequest.decodedToken.uid,
      updatedAt: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  );

  return NextResponse.json({
    success: true,
    id: productId,
  });
}
