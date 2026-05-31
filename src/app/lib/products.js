import 'server-only';

import { getAdminDb } from '@/app/lib/firebase-admin';

export async function getProduct(productId) {
  const productRef = getAdminDb().collection('shop').doc(productId);
  const productSnap = await productRef.get();

  if (!productSnap.exists) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  return {
    id: productSnap.id,
    ref: productRef,
    ...productSnap.data(),
  };
}

export async function getProductPrice(productId) {
  const product = await getProduct(productId);

  if (!Number.isFinite(Number(product.price))) {
    throw new Error('Product price is invalid');
  }

  return Number(product.price);
}
