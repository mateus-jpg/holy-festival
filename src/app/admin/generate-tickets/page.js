'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, ExternalLink, Loader2, TicketPlus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

function userLabel(user) {
  const fullName = [user.name, user.surname].filter(Boolean).join(' ');
  return fullName ? `${fullName} - ${user.email || user.uid}` : user.email || user.displayName || user.uid;
}

function productLabel(product) {
  const stock = product.availableStock === null ? 'stock libero' : `${product.availableStock} disponibili`;
  return `${product.name} (${stock})`;
}

export default function GenerateTicketsPage() {
  const { user, loading: authLoading, getUserIdToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    userId: '',
    userEmail: '',
    productId: '',
    quantity: 1,
    consumeInventory: true,
    note: '',
  });
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId),
    [products, form.productId]
  );

  useEffect(() => {
    const loadAdminData = async () => {
      if (authLoading) {
        return;
      }

      if (!user?.isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const idToken = await getUserIdToken();
        const response = await fetch('/api/admin/manual-tickets', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Caricamento dati non riuscito');
        }

        setProducts(data.products || []);
        setUsers(data.users || []);
        setForm((current) => ({
          ...current,
          productId: current.productId || data.products?.[0]?.id || '',
        }));
      } catch (err) {
        setError(err.message || 'Caricamento dati non riuscito');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [authLoading, user, getUserIdToken]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);

    try {
      const idToken = await getUserIdToken();
      const response = await fetch('/api/admin/manual-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          userEmail: form.userId ? '' : form.userEmail,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generazione non riuscita');
      }

      setResult(data);
      setForm((current) => ({
        ...current,
        quantity: 1,
        note: '',
      }));
    } catch (err) {
      setError(err.message || 'Generazione non riuscita');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
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
          <h1 className="text-4xl font-black text-[#012136]">Genera biglietti</h1>
        </div>
        <Link
          href="/admin/validate"
          className="inline-flex items-center justify-center rounded-full border border-[#012136]/18 bg-white px-5 py-3 text-sm font-bold text-[#012136] shadow-sm"
        >
          Valida QR
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c5471f]/12 text-[#c5471f]">
              <TicketPlus className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-black text-[#012136]">Nuova emissione</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#012136]">Utente</span>
              <select
                value={form.userId}
                onChange={(event) => updateField('userId', event.target.value)}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136] focus:border-transparent focus:ring-2 focus:ring-[#c5471f]"
              >
                <option value="">Email manuale</option>
                {users.map((item) => (
                  <option key={item.uid} value={item.uid}>
                    {userLabel(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#012136]">Email</span>
              <input
                type="email"
                value={form.userEmail}
                onChange={(event) => updateField('userEmail', event.target.value)}
                disabled={Boolean(form.userId)}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136] disabled:bg-[#012136]/5 disabled:text-[#012136]/45"
                placeholder="utente@email.com"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-bold text-[#012136]">Biglietto</span>
              <select
                value={form.productId}
                onChange={(event) => updateField('productId', event.target.value)}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136] focus:border-transparent focus:ring-2 focus:ring-[#c5471f]"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {productLabel(product)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#012136]">Quantità</span>
              <input
                type="number"
                min="1"
                max="100"
                value={form.quantity}
                onChange={(event) => updateField('quantity', event.target.value)}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136] focus:border-transparent focus:ring-2 focus:ring-[#c5471f]"
              />
            </label>

            <label className="flex items-center gap-3 self-end rounded-lg border border-[#012136]/12 bg-[#f6f2e8] px-4 py-3">
              <input
                type="checkbox"
                checked={form.consumeInventory}
                onChange={(event) => updateField('consumeInventory', event.target.checked)}
                className="h-5 w-5 accent-[#c5471f]"
              />
              <span className="text-sm font-bold text-[#012136]">Scala disponibilità</span>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-bold text-[#012136]">Nota</span>
              <textarea
                value={form.note}
                onChange={(event) => updateField('note', event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136] focus:border-transparent focus:ring-2 focus:ring-[#c5471f]"
                placeholder="Motivo emissione manuale"
              />
            </label>
          </div>

          {selectedProduct && (
            <div className="mt-5 rounded-lg border border-[#012136]/10 bg-[#f6f2e8] p-4 text-sm text-[#012136]/75">
              <span className="font-bold text-[#012136]">{selectedProduct.name}</span>
              {selectedProduct.description ? ` - ${selectedProduct.description}` : ''}
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-[#8f2f18]/25 bg-[#c5471f]/10 p-4 text-[#8f2f18]">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.productId || (!form.userId && !form.userEmail)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#012136] px-6 py-3 font-bold text-white transition-colors hover:bg-[#0a6f6a] disabled:cursor-not-allowed disabled:bg-[#012136]/35"
          >
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            Genera biglietti
          </button>
        </form>

        <aside className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#012136]">Risultato</h2>

          {!result ? (
            <p className="mt-4 text-[#012136]/65">Nessuna emissione in questa sessione.</p>
          ) : (
            <div className="mt-4">
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#0a6f6a]/25 bg-[#0a6f6a]/10 p-4 text-[#0a6f6a]">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Biglietti generati</p>
                  <p className="text-sm">{result.orderId}</p>
                </div>
              </div>

              <div className="space-y-3">
                {result.tickets?.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#012136]/12 px-4 py-3 text-sm font-semibold text-[#012136] hover:bg-[#012136]/5"
                  >
                    <span className="break-all">{ticket.name || ticket.id}</span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
