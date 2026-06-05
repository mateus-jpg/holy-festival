'use client';

import Link from 'next/link';
import { Calendar, ExternalLink, HeartHandshake, MapPin, Ticket, Users } from 'lucide-react';
import { eventContent } from '@/app/lib/eventContent';

export default function InfoPage() {
  return (
    <main className="min-h-screen pb-20">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-12 pt-14 text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">
          {eventContent.shortName}
        </p>
        <h1 className="text-5xl font-black leading-tight text-[#012136] md:text-7xl">
          {eventContent.title}
        </h1>
        <p className="mt-5 max-w-3xl text-xl leading-relaxed text-[#012136]/75">
          {eventContent.tagline}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#012136]/15 bg-white px-5 py-3 text-sm font-semibold text-[#012136] shadow-sm">
            <Calendar className="h-4 w-4 text-[#c5471f]" />
            {eventContent.dateRange}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#012136]/15 bg-white px-5 py-3 text-sm font-semibold text-[#012136] shadow-sm">
            <MapPin className="h-4 w-4 text-[#0a6f6a]" />
            {eventContent.location}
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <HeartHandshake className="h-6 w-6 text-[#c5471f]" />
            <h2 className="text-2xl font-black text-[#012136]">Il senso della GMR 2026</h2>
          </div>
          <div className="space-y-4 leading-relaxed text-[#012136]/76">
            <p>
              Marzo 2016, Idomeni. La frontiera tra Grecia e Macedonia del Nord si chiude
              e migliaia di persone restano bloccate in un campo improvvisato. Da lì nasce
              One Bridge To-, dieci anni fa.
            </p>
            <p>
              La Giornata Mondiale del Rifugiato 2026 attraversa questa memoria con cinema,
              teatro, dialoghi, laboratori e incontri. Il programma si muove tra Forte Sofia,
              Community Center Verona, Università di Verona e altri luoghi della città.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c5471f]">Programma</p>
            <h2 className="mt-2 text-3xl font-black text-[#012136]">Appuntamenti principali</h2>
          </div>
          <Link
            href={eventContent.sourceUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-[#012136]/18 bg-white px-4 py-2 text-sm font-bold text-[#012136] transition-colors hover:bg-[#012136]/8"
          >
            Fonte One Bridge To-
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {eventContent.program.map((day) => (
            <article key={day.date} className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 border-b border-[#012136]/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#012136]">{day.date}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#c5471f]">
                    <MapPin className="h-4 w-4" />
                    {day.place}
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {day.items.map((item) => (
                  <li key={item} className="rounded-md bg-[#f6f2e8] px-4 py-3 text-sm font-semibold text-[#012136]">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-[#012136]/68">{day.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-10 md:grid-cols-2">
        <div className="rounded-lg border border-[#012136]/12 bg-[#012136] p-7 text-white shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-6 w-6 text-[#f1b84b]" />
            <h2 className="text-2xl font-black">Partecipa come volontariə</h2>
          </div>
          <p className="leading-relaxed text-white/78">
            Servono persone per allestimenti, accoglienza, bar, cucina, gestione degli spazi
            e smontaggio. Anche poche ore aiutano.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {eventContent.volunteerRoles.map((role) => (
              <span key={role} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]">
                {role}
              </span>
            ))}
          </div>
          <Link
            href={eventContent.volunteerUrl}
            target="_blank"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#012136] transition-colors hover:bg-[#f1b84b]"
          >
            Compila il modulo
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-[#012136]/12 bg-white p-7 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Ticket className="h-6 w-6 text-[#c5471f]" />
            <h2 className="text-2xl font-black text-[#012136]">Biglietti e prenotazioni</h2>
          </div>
          <p className="leading-relaxed text-[#012136]/72">
            Gli appuntamenti indicati come su prenotazione avranno link dedicati. Per gli ingressi
            disponibili, l’app mantiene carrello, checkout Stripe e QR code nell’area
            biglietti.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c5471f] px-5 py-3 font-bold text-white transition-colors hover:bg-[#8f2f18]"
          >
            Vai alle prenotazioni
            <Ticket className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          {eventContent.practicalInfo.map((item) => (
            <article key={item.title} className="rounded-lg border border-[#012136]/12 bg-white p-5 shadow-sm">
              <h3 className="font-black text-[#012136]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#012136]/68">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
