'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Edit3, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

const emptyForm = {
  id: '',
  name: '',
  description: '',
  price: '',
  totalStock: '',
  imgUrl: '',
  validFrom: '',
  validUntil: '',
  eventId: 'holy-festival-2026',
  location: 'Forte Sofia, Verona',
  productType: 'single',
  componentProductIds: [],
  withFees: true,
  isActive: true,
};

function normalizeForm(ticket) {
  if (!ticket) {
    return emptyForm;
  }

  return {
    id: ticket.id || '',
    name: ticket.name || '',
    description: ticket.description || '',
    price: String(ticket.price ?? ''),
    totalStock: ticket.totalStock === null || ticket.totalStock === undefined ? '' : String(ticket.totalStock),
    imgUrl: ticket.imgUrl || '',
    validFrom: ticket.validFrom || '',
    validUntil: ticket.validUntil || '',
    eventId: ticket.eventId || 'holy-festival-2026',
    location: ticket.location || '',
    productType: ticket.productType === 'bundle' ? 'bundle' : 'single',
    componentProductIds: Array.isArray(ticket.componentProductIds) ? ticket.componentProductIds : [],
    withFees: ticket.withFees !== false,
    isActive: ticket.isActive !== false,
  };
}

function statusLabel(ticket) {
  if (ticket.isActive === false) {
    return 'Non in vendita';
  }

  if (ticket.availableStock === 0) {
    return 'Esaurito';
  }

  return 'In vendita';
}

function componentLabel(ticket) {
  const template = ticket.templates?.[0];
  const date = template?.validFrom ? template.validFrom.slice(0, 10) : '';
  return date ? `${ticket.name} · ${date}` : ticket.name;
}

export default function ManageTicketsPage() {
  const { user, loading: authLoading, getUserIdToken } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [bundleMode, setBundleMode] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.isActive !== false),
    [tickets]
  );
  const inactiveTickets = useMemo(
    () => tickets.filter((ticket) => ticket.isActive === false),
    [tickets]
  );
  const singleTickets = useMemo(
    () => tickets.filter((ticket) => ticket.productType === 'single' && ticket.isActive !== false),
    [tickets]
  );
  const selectedBundleTickets = useMemo(
    () => singleTickets.filter((ticket) => form.componentProductIds.includes(ticket.id)),
    [form.componentProductIds, singleTickets]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'bundle') {
      setBundleMode(true);
      setForm({ ...emptyForm, productType: 'bundle' });
    }
  }, []);

  const loadTickets = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const idToken = await getUserIdToken();
      const response = await fetch('/api/admin/shop-tickets', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Caricamento biglietti non riuscito');
      }

      setTickets(data.tickets || []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Caricamento biglietti non riuscito',
      });
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, getUserIdToken]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateProductType = (productType) => {
    setForm((current) => ({
      ...current,
      productType,
      componentProductIds: productType === 'bundle' ? current.componentProductIds : [],
    }));
  };

  const toggleComponent = (productId) => {
    setForm((current) => ({
      ...current,
      componentProductIds: current.componentProductIds.includes(productId)
        ? current.componentProductIds.filter((id) => id !== productId)
        : [...current.componentProductIds, productId],
    }));
  };

  const resetForm = () => {
    setEditingId('');
    setForm(bundleMode ? { ...emptyForm, productType: 'bundle' } : emptyForm);
  };

  const editTicket = (ticket) => {
    setEditingId(ticket.id);
    setForm(normalizeForm(ticket));
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const idToken = await getUserIdToken();
      const response = await fetch('/api/admin/shop-tickets', {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...form,
          id: editingId || form.id,
          price: Number(form.price),
          totalStock: form.totalStock === '' ? '' : Number(form.totalStock),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Salvataggio non riuscito');
      }

      setMessage({
        type: 'success',
        text: editingId ? 'Biglietto aggiornato.' : 'Biglietto creato.',
      });
      resetForm();
      await loadTickets();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Salvataggio non riuscito',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deactivateTicket = async (ticket) => {
    const confirmed = window.confirm(`Rimuovere "${ticket.name}" dallo shop? I biglietti già acquistati resteranno validi.`);
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const idToken = await getUserIdToken();
      const response = await fetch(`/api/admin/shop-tickets?id=${encodeURIComponent(ticket.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Eliminazione non riuscita');
      }

      setMessage({
        type: 'success',
        text: 'Biglietto rimosso dallo shop.',
      });
      await loadTickets();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Eliminazione non riuscita',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTicket = async (ticket) => {
    setSubmitting(true);
    setMessage(null);

    try {
      const idToken = await getUserIdToken();
      const response = await fetch('/api/admin/shop-tickets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...normalizeForm(ticket),
          isActive: !ticket.isActive,
          price: Number(ticket.price || 0),
          totalStock: ticket.totalStock === '' ? '' : Number(ticket.totalStock),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Aggiornamento stato non riuscito');
      }

      setMessage({
        type: 'success',
        text: ticket.isActive ? 'Biglietto disattivato.' : 'Biglietto riattivato.',
      });
      await loadTickets();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Aggiornamento stato non riuscito',
      });
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
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">Admin</p>
          <h1 className="text-4xl font-black text-[#012136]">Gestisci biglietti</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/manage-tickets?type=bundle" className="site-button site-button-primary">
            Crea abbonamento
          </Link>
          <Link href="/admin/generate-tickets" className="site-button site-button-secondary">
            Genera manuali
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-lg border p-4 ${
            message.type === 'success'
              ? 'border-[#0a6f6a]/25 bg-[#0a6f6a]/10 text-[#0a6f6a]'
              : 'border-[#8f2f18]/25 bg-[#c5471f]/10 text-[#8f2f18]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          )}
          <p className="font-bold">{message.text}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
        <form onSubmit={submitTicket} className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c5471f]/12 text-[#c5471f]">
                {editingId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <h2 className="text-2xl font-black text-[#012136]">
                {editingId ? 'Modifica biglietto' : 'Nuovo biglietto'}
              </h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#012136]/18 text-[#012136]"
                aria-label="Annulla modifica"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#012136]">Tipo di prodotto</span>
                <select
                  value={form.productType}
                  onChange={(event) => updateProductType(event.target.value)}
                  disabled={Boolean(editingId)}
                  className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136] disabled:bg-[#012136]/5 disabled:text-[#012136]/60"
                >
                  <option value="single">Biglietto singolo</option>
                  <option value="bundle">Pacchetto / abbonamento</option>
                </select>
                {editingId && (
                  <span className="mt-2 block text-xs text-[#012136]/60">
                    Il tipo non si cambia dopo la creazione: per un nuovo pacchetto crea un nuovo prodotto.
                  </span>
                )}
              </label>

              {!editingId && (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#012136]">ID opzionale</span>
                <input
                  value={form.id}
                  onChange={(event) => updateField('id', event.target.value)}
                  className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                  placeholder="sabato-20"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#012136]">Nome</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                placeholder="Ingresso Sabato 20"
                required
              />
            </label>

            {form.productType === 'bundle' && (
              <fieldset className="rounded-lg border border-[#c5471f]/30 bg-[#f6f2e8] p-4">
                <legend className="px-1 text-sm font-bold text-[#012136]">Biglietti inclusi nell’abbonamento</legend>
                <p className="mb-3 text-sm text-[#012136]/70">
                  Seleziona i biglietti singoli già creati. Ne verrà generato uno per ogni giornata.
                </p>
                {singleTickets.length === 0 ? (
                  <p className="rounded-lg border border-[#8f2f18]/25 bg-[#c5471f]/10 p-3 text-sm font-semibold text-[#8f2f18]">
                    Crea prima almeno due biglietti singoli.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {singleTickets.map((ticket) => (
                      <label key={ticket.id} className="flex items-start gap-3 rounded-lg border border-[#012136]/12 bg-white px-3 py-3">
                        <input
                          type="checkbox"
                          checked={form.componentProductIds.includes(ticket.id)}
                          onChange={() => toggleComponent(ticket.id)}
                          className="mt-1 h-4 w-4 accent-[#c5471f]"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-[#012136]">{ticket.name}</span>
                          <span className="block text-xs text-[#012136]/60">{componentLabel(ticket)}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#c5471f]">
                  {form.componentProductIds.length} ticket selezionati
                </p>
              </fieldset>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#012136]">Descrizione</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                placeholder="Descrizione visibile nello shop"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#012136]">Prezzo</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => updateField('price', event.target.value)}
                  className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#012136]">Disponibilità</span>
                <input
                  type="number"
                  min="0"
                  value={form.totalStock}
                  onChange={(event) => updateField('totalStock', event.target.value)}
                  className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                  placeholder="Illimitata"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#012136]">Immagine</span>
              <input
                value={form.imgUrl}
                onChange={(event) => updateField('imgUrl', event.target.value)}
                className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                placeholder="https://..."
              />
            </label>

            {form.productType === 'single' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#012136]">Valido da</span>
                    <input
                      type="datetime-local"
                      value={form.validFrom}
                      onChange={(event) => updateField('validFrom', event.target.value)}
                      className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#012136]">Valido fino</span>
                    <input
                      type="datetime-local"
                      value={form.validUntil}
                      onChange={(event) => updateField('validUntil', event.target.value)}
                      className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#012136]">Evento</span>
                    <input
                      value={form.eventId}
                      onChange={(event) => updateField('eventId', event.target.value)}
                      className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#012136]">Luogo</span>
                    <input
                      value={form.location}
                      onChange={(event) => updateField('location', event.target.value)}
                      className="w-full rounded-lg border border-[#012136]/20 bg-white px-4 py-3 text-[#012136]"
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-[#012136]/12 bg-[#f6f2e8] p-4 text-sm text-[#012136]/75">
                <p className="font-bold text-[#012136]">Validità del pacchetto</p>
                {selectedBundleTickets.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {selectedBundleTickets.map((ticket) => (
                      <li key={ticket.id}>{componentLabel(ticket)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2">La validità verrà ereditata dai ticket selezionati.</p>
                )}
                <p className="mt-2 text-xs">Evento, luogo e date vengono derivati server-side dai componenti.</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-[#012136]/12 bg-[#f6f2e8] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.withFees}
                  onChange={(event) => updateField('withFees', event.target.checked)}
                  className="h-5 w-5 accent-[#c5471f]"
                />
                <span className="text-sm font-bold text-[#012136]">Commissioni</span>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-[#012136]/12 bg-[#f6f2e8] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateField('isActive', event.target.checked)}
                  className="h-5 w-5 accent-[#0a6f6a]"
                />
                <span className="text-sm font-bold text-[#012136]">In vendita</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || (form.productType === 'bundle' && form.componentProductIds.length < 2)}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#012136] px-6 py-3 font-bold text-white transition-colors hover:bg-[#0a6f6a] disabled:bg-[#012136]/35"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {editingId ? 'Salva modifiche' : form.productType === 'bundle' ? 'Crea abbonamento' : 'Crea biglietto'}
          </button>
        </form>

        <section className="space-y-6">
          <TicketList
            title="In vendita"
            tickets={activeTickets}
            submitting={submitting}
            onEdit={editTicket}
            onToggle={toggleTicket}
            onDelete={deactivateTicket}
          />
          <TicketList
            title="Non in vendita"
            tickets={inactiveTickets}
            submitting={submitting}
            onEdit={editTicket}
            onToggle={toggleTicket}
            onDelete={deactivateTicket}
          />
        </section>
      </div>
    </main>
  );
}

function TicketList({ title, tickets, submitting, onEdit, onToggle, onDelete }) {
  return (
    <section className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-[#012136]">{title}</h2>
        <span className="rounded-full bg-[#012136]/8 px-3 py-1 text-sm font-bold text-[#012136]/70">
          {tickets.length}
        </span>
      </div>

      {tickets.length === 0 ? (
        <p className="rounded-lg border border-[#012136]/10 bg-[#f6f2e8] p-4 text-[#012136]/65">
          Nessun biglietto in questa sezione.
        </p>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-lg border border-[#012136]/12 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-[#012136]">{ticket.name || ticket.id}</h3>
                    <span className="rounded-full bg-[#c5471f]/12 px-2.5 py-1 text-xs font-bold text-[#c5471f]">
                      {ticket.productType === 'bundle'
                        ? `Abbonamento · ${ticket.componentCount || 0} ticket`
                        : 'Biglietto singolo'}
                    </span>
                    <span className="rounded-full bg-[#012136]/8 px-2.5 py-1 text-xs font-bold text-[#012136]/70">
                      {statusLabel(ticket)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#012136]/60">{ticket.id}</p>
                  {ticket.description && (
                    <p className="mt-2 text-sm text-[#012136]/70">{ticket.description}</p>
                  )}
                  {ticket.productType === 'bundle' && ticket.templates?.length > 0 && (
                    <p className="mt-2 text-sm font-semibold text-[#012136]/70">
                      Include: {ticket.templates.map((template) => template.name).filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-[#012136]/75">
                    <span>€{Number(ticket.price || 0).toFixed(2)}</span>
                    <span>Venduti: {ticket.soldCount || 0}</span>
                    <span>
                      Disponibili: {ticket.availableStock === null ? 'illimitati' : ticket.availableStock}
                    </span>
                    {ticket.validFrom && <span>Da: {ticket.validFrom.replace('T', ' ')}</span>}
                    {ticket.validUntil && <span>Fino: {ticket.validUntil.replace('T', ' ')}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit(ticket)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full border border-[#012136]/18 px-4 py-2 text-sm font-bold text-[#012136] hover:bg-[#012136]/8 disabled:opacity-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(ticket)}
                    disabled={submitting}
                    className="rounded-full border border-[#0a6f6a]/25 px-4 py-2 text-sm font-bold text-[#0a6f6a] hover:bg-[#0a6f6a]/8 disabled:opacity-50"
                  >
                    {ticket.isActive ? 'Disattiva' : 'Riattiva'}
                  </button>
                  {ticket.isActive && (
                    <button
                      type="button"
                      onClick={() => onDelete(ticket)}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-full border border-[#8f2f18]/25 px-4 py-2 text-sm font-bold text-[#8f2f18] hover:bg-[#c5471f]/8 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Elimina
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
