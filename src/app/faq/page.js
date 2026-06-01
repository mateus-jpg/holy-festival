'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronDown, ExternalLink, HeartHandshake, MapPin, Ticket, Users } from 'lucide-react';
import { eventContent } from '@/app/lib/eventContent';

const faqs = [
  {
    icon: Calendar,
    question: 'Quando si svolge la GMR 2026?',
    answer: 'Gli appuntamenti pubblicati sono in programma il 12, 13, 18, 19, 20 e 21 giugno 2026 a Verona.',
  },
  {
    icon: MapPin,
    question: 'Dove si svolgono gli eventi?',
    answer: 'Il programma attraversa Forte Sofia, Community Center Verona, Università degli Studi di Verona e Stazione Verona Porta Nuova.',
  },
  {
    icon: Ticket,
    question: 'Come funzionano biglietti e prenotazioni?',
    answer: 'Gli eventi indicati come su prenotazione avranno link dedicati. I biglietti acquistati nello shop restano disponibili nella tua area biglietti con QR code.',
  },
  {
    icon: Users,
    question: 'Posso partecipare come volontariə?',
    answer: 'Sì. Servono persone per allestimenti, accoglienza, bar, cucina, gestione degli spazi e smontaggio. Anche poche ore sono utili.',
  },
  {
    icon: HeartHandshake,
    question: 'Chi organizza la Giornata Mondiale del Rifugiato?',
    answer: 'L’iniziativa è curata da One Bridge To-, associazione nata nel 2016 a partire dall’esperienza di Idomeni e attiva lungo la Rotta Balcanica e a Verona.',
  },
  {
    icon: HeartHandshake,
    question: 'Qual è il tema del 2026?',
    answer: 'Il claim è “Una frontiera che si chiude, un percorso che si apre”: memoria, confini, diritti, cura e percorsi collettivi che restano aperti.',
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
        <h1 className="text-5xl font-black text-[#012136] md:text-6xl">Domande frequenti</h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-[#012136]/72">
          Le informazioni essenziali su programma, luoghi, prenotazioni e volontariato.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6">
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} faq={faq} />
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-[#012136]/12 bg-[#012136] p-6 text-white shadow-sm">
          <h2 className="text-xl font-black">Modulo volontariə</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/76">
            Per dare disponibilità su una o più giornate puoi usare il modulo pubblicato da One Bridge To-.
          </p>
          <Link
            href={eventContent.volunteerUrl}
            target="_blank"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#012136] transition-colors hover:bg-[#f1b84b]"
          >
            Apri modulo
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
