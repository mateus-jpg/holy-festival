import admin from 'firebase-admin';

function getAdminDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  return admin.firestore();
}

export async function getProductPrice(productId) {
  const productRef = getAdminDb().collection('shop').doc(productId);
  const productSnap = await productRef.get();

  if (!productSnap.exists) {
    throw new Error('Product not found');
  }

  return productSnap.data().price;
}
