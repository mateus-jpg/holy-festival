'use client';

import Link from 'next/link';
import { ClipboardList, QrCode, TicketPlus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AdminHome() {
  const { user, loading } = useAuth();

  if (loading) {
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
        <p className="mt-3 text-[#012136]/70">Accedi con un account amministratore.</p>
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
        <p className="mt-3 text-[#012136]/70">Questa area è riservata agli amministratori.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">Admin</p>
        <h1 className="text-4xl font-black text-[#012136]">Pannello biglietti</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/manage-tickets"
          className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
        >
          <ClipboardList className="mb-5 h-10 w-10 text-[#012136]" />
          <h2 className="text-2xl font-black text-[#012136]">Gestisci shop</h2>
          <p className="mt-3 text-[#012136]/68">Crea, modifica o rimuovi biglietti acquistabili.</p>
        </Link>

        <Link
          href="/admin/generate-tickets"
          className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
        >
          <TicketPlus className="mb-5 h-10 w-10 text-[#c5471f]" />
          <h2 className="text-2xl font-black text-[#012136]">Genera biglietti</h2>
          <p className="mt-3 text-[#012136]/68">Crea biglietti manuali per un utente registrato.</p>
        </Link>

        <Link
          href="/admin/validate"
          className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
        >
          <QrCode className="mb-5 h-10 w-10 text-[#0a6f6a]" />
          <h2 className="text-2xl font-black text-[#012136]">Valida QR</h2>
          <p className="mt-3 text-[#012136]/68">Scansiona o incolla un QR per convalidare il biglietto.</p>
        </Link>
      </div>
    </main>
  );
}
