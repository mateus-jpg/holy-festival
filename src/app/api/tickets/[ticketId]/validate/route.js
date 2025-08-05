// app/api/tickets/[ticketId]/validate/route.js

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// --- Initialize Firebase Admin SDK ---
// This pattern prevents re-initializing the app in serverless environments
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Use application default credentials (useful for Google Cloud environments)
      // For local development, ensure you have the GOOGLE_APPLICATION_CREDENTIALS env var set
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Verifies the Firebase ID token from the Authorization header.
 * @param {Request} request - The incoming request object.
 * @returns {Promise<admin.auth.DecodedIdToken|null>} The decoded token or null if invalid.
 */
async function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function POST(request, { params }) {
  try {
    const { ticketId } = params;
    
    // Verify the token and get the decoded user data
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Token di autorizzazione mancante o non valido' },
        { status: 401 }
      );
    }
    const userId = decodedToken.uid;

    // Check if the user is an admin
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return NextResponse.json(
        { error: 'Accesso negato. Solo gli amministratori possono validare i biglietti.' },
        { status: 403 }
      );
    }

    // Get the ticket document
    const ticketDocRef = db.collection('tickets').doc(ticketId);
    const ticketDoc = await ticketDocRef.get();

    if (!ticketDoc.exists) {
      return NextResponse.json(
        { error: 'Biglietto non trovato' },
        { status: 404 }
      );
    }

    const ticketData = ticketDoc.data();

    // Check if ticket is already validated
    if (ticketData.status === 'validated') {
      return NextResponse.json(
        { error: 'Biglietto già validato' },
        { status: 400 }
      );
    }

    // Update ticket: set status to validated
    await ticketDocRef.update({
      status: 'validated',
      valid: false,
      validatedAt: admin.firestore.FieldValue.serverTimestamp(),
      validatedBy: userId
    });

    // Create a scan log document
    const scanData = {
      ticketId: ticketId,
      userId: ticketData.userId,
      ticketName: ticketData.name,
      eventId: ticketData.eventId,
      scannedAt: admin.firestore.FieldValue.serverTimestamp(),
      scannedBy: userId,
      scannerInfo: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      },
      validationStatus: 'success'
    };

    const scanDocRef = await db.collection('scans').add(scanData);

    return NextResponse.json({
      success: true,
      message: 'Biglietto validato con successo',
      ticket: {
        id: ticketId,
        status: 'validated',
      },
      scanId: scanDocRef.id
    });

  } catch (error) {
    console.error('Error validating ticket:', error);
    return NextResponse.json(
      { error: 'Errore interno del server durante la validazione' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { ticketId } = params;
    
    // Verify token
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Token di autorizzazione mancante o non valido' },
        { status: 401 }
      );
    }
    const userId = decodedToken.uid;

    // Check if user is an admin
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      );
    }

    // Get the ticket document using Admin SDK syntax
    const ticketDocRef = db.collection('tickets').doc(ticketId);
    const ticketDoc = await ticketDocRef.get();

    if (!ticketDoc.exists()) {
      return NextResponse.json(
        { error: 'Biglietto non trovato' },
        { status: 404 }
      );
    }

    const ticketData = ticketDoc.data();

    return NextResponse.json({
      ticketId: ticketId,
      valid: ticketData.valid, // Assuming 'valid' is still a field you want to return
      status: ticketData.status,
      validatedAt: ticketData.validatedAt,
      validatedBy: ticketData.validatedBy,
      canValidate: ticketData.status !== 'validated'
    });

  } catch (error) {
    console.error('Error checking ticket status:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
