// app/api/tickets/[ticketId]/validate/route.js

import { NextResponse } from 'next/server';
import { admin, getAdminDb } from '@/app/lib/firebase-admin';
import { verifyAdminRequest } from '@/app/lib/server-auth';

export const runtime = 'nodejs';

function toDate(value) {
  if (!value) {
    return null;
  }

  return value.toDate ? value.toDate() : new Date(value);
}

function getTicketDateError(ticketData) {
  const now = new Date();
  const validFrom = toDate(ticketData.validFrom);
  const validUntil = toDate(ticketData.validUntil);

  if (validFrom && now < validFrom) {
    return 'Biglietto non ancora valido';
  }

  if (validUntil && now > validUntil) {
    return 'Biglietto scaduto';
  }

  return null;
}

function handledError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function POST(request, { params }) {
  try {
    const { ticketId } = await params;
    const db = getAdminDb();
    
    const adminRequest = await verifyAdminRequest(request);
    if (adminRequest.error) {
      return NextResponse.json(
        { error: adminRequest.error },
        { status: adminRequest.status }
      );
    }
    const userId = adminRequest.decodedToken.uid;

    // Get the ticket document
    const ticketDocRef = db.collection('tickets').doc(ticketId);
    const scanDocRef = db.collection('scans').doc();
    let ticketData;

    await db.runTransaction(async (transaction) => {
      const ticketDoc = await transaction.get(ticketDocRef);

      if (!ticketDoc.exists) {
        throw handledError('Biglietto non trovato', 404);
      }

      ticketData = ticketDoc.data();

      // Check if ticket is already validated
      if (ticketData.status === 'validated' || ticketData.valid === false) {
        throw handledError('Biglietto già validato', 400);
      }

      const dateError = getTicketDateError(ticketData);
      if (dateError) {
        throw handledError(dateError, 400);
      }

      // Update ticket and scan log atomically.
      transaction.update(ticketDocRef, {
        status: 'validated',
        valid: false,
        validatedAt: admin.firestore.FieldValue.serverTimestamp(),
        validatedBy: userId
      });

      transaction.set(scanDocRef, {
        ticketId: ticketId,
        userId: ticketData.userId,
        ticketName: ticketData.name,
        eventId: ticketData.eventId,
        scannedAt: admin.firestore.FieldValue.serverTimestamp(),
        scannedBy: userId,
        scannerInfo: {
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown'
        },
        validationStatus: 'success'
      });
    });


    return NextResponse.json({
      success: true,
      message: 'Biglietto validato con successo',
      ticket: {
        id: ticketId,
        status: 'validated',
        validatedAt: new Date().toISOString(),
      },
      scanId: scanDocRef.id
    });

  } catch (error) {
    console.error('Error validating ticket:', error);
    if (error.status) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Errore interno del server durante la validazione' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { ticketId } = await params;
    const db = getAdminDb();
    
    const adminRequest = await verifyAdminRequest(request);
    if (adminRequest.error) {
      return NextResponse.json(
        { error: adminRequest.error },
        { status: adminRequest.status }
      );
    }

    // Get the ticket document using Admin SDK syntax
    const ticketDocRef = db.collection('tickets').doc(ticketId);
    const ticketDoc = await ticketDocRef.get();

    if (!ticketDoc.exists) {
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
      canValidate: ticketData.status !== 'validated' && ticketData.valid !== false && !getTicketDateError(ticketData)
    });

  } catch (error) {
    console.error('Error checking ticket status:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
