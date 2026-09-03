'use client';

import Link from 'next/link';
import { ClipboardList, QrCode, TicketPlus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AdminHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#ff0053]" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="site-kicker">Holy Festival · Admin</p>
        <h1 className="display-heading mt-3 text-5xl text-[#fffaff]">Accesso richiesto</h1>
        <p className="mt-4 text-[#d7c5e2]">Accedi con un account amministratore per gestire shop e ingressi.</p>
        <Link href="/auth" className="site-button site-button-primary mt-7">
          Accedi
        </Link>
      </main>
    );
  }

  if (!user.isAdmin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="site-kicker">Holy Festival · Admin</p>
        <h1 className="display-heading mt-3 text-5xl text-[#fffaff]">Accesso negato</h1>
        <p className="mt-4 text-[#d7c5e2]">Questa area è riservata agli amministratori.</p>
      </main>
    );
  }

  return (
    <main className="admin-page-shell mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="admin-hero mb-8">
        <div className="relative z-10 max-w-3xl">
          <p className="site-kicker">Holy Festival · Area amministrazione</p>
          <h1 className="display-heading mt-4 text-5xl text-[#fffaff] sm:text-7xl">
            Ingressi pronti per il festival.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#d7c5e2] sm:text-lg">
            Pubblica i ticket giornalieri oppure crea un abbonamento che li raccoglie tutti in un solo acquisto.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin/manage-tickets?type=bundle" className="site-button site-button-primary">
              Crea abbonamento
            </Link>
            <Link href="/admin/manage-tickets" className="site-button site-button-secondary">
              Gestisci biglietti
            </Link>
          </div>
        </div>
        <div className="admin-hero-stamp" aria-hidden="true">
          HOLY
          <span>ADMIN</span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3" aria-label="Azioni amministrazione">
        <Link
          href="/admin/manage-tickets"
          className="admin-action-card admin-action-card--cyan"
        >
          <ClipboardList className="mb-5 h-10 w-10" aria-hidden="true" />
          <h2 className="text-2xl font-black">Gestisci shop</h2>
          <p className="mt-3">Crea, modifica o rimuovi biglietti acquistabili.</p>
        </Link>

        <Link
          href="/admin/generate-tickets"
          className="admin-action-card admin-action-card--lime"
        >
          <TicketPlus className="mb-5 h-10 w-10" aria-hidden="true" />
          <h2 className="text-2xl font-black">Genera biglietti</h2>
          <p className="mt-3">Crea biglietti manuali per un utente registrato.</p>
        </Link>

        <Link
          href="/admin/validate"
          className="admin-action-card admin-action-card--magenta"
        >
          <QrCode className="mb-5 h-10 w-10" aria-hidden="true" />
          <h2 className="text-2xl font-black">Valida QR</h2>
          <p className="mt-3">Scansiona o incolla un QR per convalidare il biglietto.</p>
        </Link>
      </div>
    </main>
  );
}
