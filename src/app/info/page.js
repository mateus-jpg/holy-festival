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
        <h1 className="display-heading text-5xl leading-tight text-[#fffaff] md:text-7xl">
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
            <h2 className="display-heading text-2xl text-[#fffaff]">Musica, comunità, solidarietà</h2>
          </div>
          <div className="space-y-4 leading-relaxed text-[#012136]/76">
            <p>
              Tre giorni di musica indipendente, birra artigianale e solidarietà nella splendida
              cornice di Forte Sofia. Holy Festival è una rete di realtà che ogni giorno costruiscono
              comunità, accoglienza e nuove possibilità.
            </p>
            <p>
              Ogni biglietto contribuisce a sostenere la clinica medica di Bajed Kandala in Kurdistan
              iracheno, che garantisce cure mediche di base gratuite a migliaia di persone. Con le
              prime tre edizioni sono stati raccolti quasi 18.000 euro.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#c5471f]">Line-up</p>
            <h2 className="display-heading mt-2 text-3xl text-[#fffaff]">Tre serate, dieci nomi</h2>
          </div>
          <Link
            href={eventContent.sourceUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-[#012136]/18 bg-white px-4 py-2 text-sm font-bold text-[#012136] transition-colors hover:bg-[#012136]/8"
          >
            Pagina ufficiale
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
            Holy Festival si costruisce insieme: servono persone per allestimenti, accoglienza,
            bar, cucina, cura degli spazi e smontaggio.
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
            Scrivi per partecipare
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-[#012136]/12 bg-white p-7 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Ticket className="h-6 w-6 text-[#c5471f]" />
            <h2 className="text-2xl font-black text-[#012136]">Prenotazioni</h2>
          </div>
          <p className="leading-relaxed text-[#012136]/72">
            Acquista il giornaliero o l’abbonamento tre giorni. Il carrello, il checkout Stripe
            e il QR code nell’area biglietti restano invariati.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c5471f] px-5 py-3 font-bold text-white transition-colors hover:bg-[#8f2f18]"
          >
            Vai ai biglietti
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
