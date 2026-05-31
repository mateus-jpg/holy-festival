'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Camera, CheckCircle, ExternalLink, Loader2, QrCode, Square } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

function extractTicketId(value) {
  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) {
    return '';
  }

  try {
    const url = new URL(trimmedValue);
    const match = url.pathname.match(/\/tickets\/([^/?#]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    const match = trimmedValue.match(/\/tickets\/([^/?#]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return trimmedValue.split(/[?#]/)[0].replace(/\/$/, '');
}

export default function ValidateTicketsPage() {
  const { user, loading: authLoading, getUserIdToken } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const validatingRef = useRef(false);
  const [rawValue, setRawValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState(null);

  const stopScanner = useCallback(() => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, []);

  useEffect(() => stopScanner, [stopScanner]);

  const validateTicket = useCallback(async (value) => {
    const ticketId = extractTicketId(value);
    if (!ticketId) {
      setResult({
        status: 'error',
        message: 'QR o ID biglietto non valido',
      });
      return;
    }

    if (validatingRef.current) {
      return;
    }

    validatingRef.current = true;
    setValidating(true);
    setResult(null);

    try {
      const idToken = await getUserIdToken();
      const response = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/validate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Validazione non riuscita');
      }

      setResult({
        status: 'success',
        ticketId,
        scanId: data.scanId,
        message: data.message || 'Biglietto validato con successo',
      });
      setRawValue('');
    } catch (error) {
      setResult({
        status: 'error',
        ticketId,
        message: error.message || 'Validazione non riuscita',
      });
    } finally {
      validatingRef.current = false;
      setValidating(false);
    }
  }, [getUserIdToken]);

  const startScanner = async () => {
    setCameraError('');
    setResult(null);

    if (!('BarcodeDetector' in window)) {
      setCameraError('Scanner fotocamera non supportato da questo browser. Usa il campo manuale.');
      return;
    }

    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);

      const scanFrame = async () => {
        if (!videoRef.current || !streamRef.current) {
          return;
        }

        try {
          if (videoRef.current.readyState >= 2 && !validatingRef.current) {
            const codes = await detector.detect(videoRef.current);
            const rawCode = codes?.[0]?.rawValue;
            if (rawCode) {
              stopScanner();
              await validateTicket(rawCode);
              return;
            }
          }
        } catch (error) {
          setCameraError(error.message || 'Lettura QR non riuscita');
        }

        frameRef.current = window.requestAnimationFrame(scanFrame);
      };

      frameRef.current = window.requestAnimationFrame(scanFrame);
    } catch (error) {
      stopScanner();
      setCameraError(error.message || 'Impossibile avviare la fotocamera');
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    stopScanner();
    await validateTicket(rawValue);
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#c5471f]" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-black text-[#012136]">Accesso richiesto</h1>
        <Link href="/auth" className="mt-6 rounded-full bg-[#012136] px-6 py-3 font-bold text-white">
          Accedi
        </Link>
      </main>
    );
  }

  if (!user.isAdmin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-black text-[#8f2f18]">Accesso negato</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">Admin</p>
          <h1 className="text-4xl font-black text-[#012136]">Valida QR</h1>
        </div>
        <Link
          href="/admin/generate-tickets"
          className="inline-flex items-center justify-center rounded-full border border-[#012136]/18 bg-white px-5 py-3 text-sm font-bold text-[#012136] shadow-sm"
        >
          Genera biglietti
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0a6f6a]/12 text-[#0a6f6a]">
              <QrCode className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black text-[#012136]">Scanner</h2>
          </div>

          <div className="relative overflow-hidden rounded-lg bg-[#012136]">
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-[4/3] w-full object-cover"
            />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#012136] text-white/70">
                <QrCode className="h-16 w-16" />
              </div>
            )}
            {scanning && (
              <div className="pointer-events-none absolute inset-0 border-[12px] border-white/10">
                <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-white" />
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {!scanning ? (
              <button
                type="button"
                onClick={startScanner}
                disabled={validating}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#012136] px-6 py-3 font-bold text-white transition-colors hover:bg-[#0a6f6a] disabled:bg-[#012136]/35"
              >
                <Camera className="h-5 w-5" />
                Avvia scanner
              </button>
            ) : (
              <button
                type="button"
                onClick={stopScanner}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#8f2f18] px-6 py-3 font-bold text-white transition-colors hover:bg-[#6f2412]"
              >
                <Square className="h-5 w-5" />
                Ferma scanner
              </button>
            )}
          </div>

          {cameraError && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-[#8f2f18]/25 bg-[#c5471f]/10 p-4 text-[#8f2f18]">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="font-semibold">{cameraError}</p>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="mt-6 border-t border-[#012136]/10 pt-6">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#012136]">QR, link o ID biglietto</span>
              <input
                value={rawValue}
                onChange={(event) => setRawValue(event.target.value)}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136] focus:border-transparent focus:ring-2 focus:ring-[#c5471f]"
                placeholder="TCKT-..."
              />
            </label>
            <button
              type="submit"
              disabled={validating || !rawValue.trim()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c5471f] px-6 py-3 font-bold text-white transition-colors hover:bg-[#8f2f18] disabled:cursor-not-allowed disabled:bg-[#c5471f]/35"
            >
              {validating && <Loader2 className="h-5 w-5 animate-spin" />}
              Valida biglietto
            </button>
          </form>
        </section>

        <aside className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#012136]">Esito</h2>

          {!result ? (
            <p className="mt-4 text-[#012136]/65">Nessuna validazione in questa sessione.</p>
          ) : (
            <div className="mt-4">
              <div
                className={`flex items-start gap-3 rounded-lg border p-4 ${
                  result.status === 'success'
                    ? 'border-[#0a6f6a]/25 bg-[#0a6f6a]/10 text-[#0a6f6a]'
                    : 'border-[#8f2f18]/25 bg-[#c5471f]/10 text-[#8f2f18]'
                }`}
              >
                {result.status === 'success' ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-bold">{result.message}</p>
                  {result.ticketId && <p className="break-all text-sm">{result.ticketId}</p>}
                  {result.scanId && <p className="mt-1 text-xs">Scan {result.scanId}</p>}
                </div>
              </div>

              {result.ticketId && (
                <Link
                  href={`/tickets/${result.ticketId}`}
                  className="mt-4 flex items-center justify-between rounded-lg border border-[#012136]/12 px-4 py-3 text-sm font-bold text-[#012136] hover:bg-[#012136]/5"
                >
                  Apri biglietto
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
