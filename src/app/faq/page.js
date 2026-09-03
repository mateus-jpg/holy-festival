'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronDown, ExternalLink, HeartHandshake, MapPin, Ticket, Users } from 'lucide-react';
import { eventContent } from '@/app/lib/eventContent';

const faqs = [
  {
    icon: Calendar,
    question: 'Quando si svolge Holy Festival 2026?',
    answer: 'Holy Festival 2026 si svolge venerdì 11, sabato 12 e domenica 13 settembre 2026 a Forte Sofia, Verona.',
  },
  {
    icon: MapPin,
    question: 'Dove si svolgono gli eventi?',
    answer: 'Tutte le giornate si svolgono a Forte Sofia, in Via Monte Novegno, 37138 Verona.',
  },
  {
    icon: Ticket,
    question: 'Come funzionano biglietti e prenotazioni?',
    answer: 'Il giornaliero costa €10 venerdì, €10 sabato e €5 domenica. L’abbonamento per tutte e tre le giornate costa €20. Venerdì e sabato l’ingresso è libero fino alle 20:00, mentre il biglietto garantisce l’accesso in ogni orario di apertura; domenica il biglietto è sempre richiesto. I biglietti acquistati nello shop restano disponibili nella tua area biglietti con QR code.',
  },
  {
    icon: Users,
    question: 'Posso partecipare come volontariə?',
    answer: 'Sì. Servono persone per allestimenti, accoglienza, bar, cucina, gestione degli spazi e smontaggio. Anche poche ore sono utili.',
  },
  {
    icon: HeartHandshake,
    question: 'Chi organizza Holy Festival?',
    answer: 'Holy Festival è ideato e organizzato da RedLab Darkroom, One Bridge To-, Osteria ai Preti, Santa Maria Craft Pub e Forte Sofia APS.',
  },
  {
    icon: HeartHandshake,
    question: 'Dove vanno i fondi del festival?',
    answer: 'Ogni biglietto contribuisce a sostenere la clinica medica di Bajed Kandala, in Kurdistan iracheno. Le prime tre edizioni hanno raccolto quasi 18.000 euro per progetti in Kurdistan iracheno.',
  },
];

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  const itemId = useId();
  const Icon = faq.icon;
  const buttonId = `${itemId}-button`;
  const panelId = `${itemId}-panel`;

  return (
    <div className="overflow-hidden rounded-lg border border-[#012136]/12 bg-white shadow-sm">
      <button
        type="button"
        id={buttonId}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#012136]/5"
      >
        <Icon className="h-5 w-5 text-[#c5471f]" aria-hidden="true" />
        <span className="flex-1 font-black text-[#012136]">{faq.question}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 text-[#012136]/50 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="px-5 pb-5 pt-1 text-sm leading-relaxed text-[#012136]/70"
        >
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="min-h-screen pb-20">
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-10 pt-14 text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">
          {eventContent.shortName}
        </p>
        <h1 className="display-heading text-5xl text-[#fffaff] md:text-7xl">Domande frequenti</h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-[#012136]/72">
          Programma, accessi, biglietti e tutto quello che serve per arrivare prontə.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6">
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} faq={faq} />
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-[#012136]/12 bg-[#012136] p-6 text-white shadow-sm">
          <h2 className="text-xl font-black">Vuoi dare una mano?</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/76">
            Per disponibilità su allestimenti, accoglienza, bar, cucina o smontaggio scrivi a Forte Sofia.
          </p>
          <Link
            href={eventContent.volunteerUrl}
            target="_blank"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#012136] transition-colors hover:bg-[#f1b84b]"
          >
            Scrivi a Forte Sofia
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
