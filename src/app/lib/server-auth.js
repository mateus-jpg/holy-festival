import 'server-only';

import { getAdminAuth, getAdminDb } from '@/app/lib/firebase-admin';

function getBearerToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length).trim() || null;
}

export async function verifyFirebaseIdToken(request) {
  const idToken = getBearerToken(request);
  if (!idToken) {
    return null;
  }

  try {
    return await getAdminAuth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}

export async function verifyAdminRequest(request) {
  const decodedToken = await verifyFirebaseIdToken(request);
  if (!decodedToken) {
    return {
      error: 'Token di autorizzazione mancante o non valido',
      status: 401,
    };
  }

  const userDoc = await getAdminDb().collection('users').doc(decodedToken.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    return {
      error: 'Accesso negato',
      status: 403,
    };
  }

  return {
    decodedToken,
    user: userDoc.data(),
  };
}
