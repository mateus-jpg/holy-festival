'use client';

import { useState } from 'react';
import { ChevronDown, Ticket, MapPin, Car, Utensils, Clock, Bus, Users, Heart } from 'lucide-react';

const faqs = [
  {
    icon: <Ticket className="w-5 h-5 text-indigo-400" />,
    question: 'Quanto costano i biglietti?',
    answer:
      "L'ingresso per una singola serata costa \u20AC10. L'abbonamento per tutte e tre le serate costa \u20AC20. I biglietti sono acquistabili in prevendita dallo Shop dell'app.",
  },
  {
    icon: <Ticket className="w-5 h-5 text-indigo-400" />,
    question: 'Posso entrare senza biglietto?',
    answer:
      "No, l'ingresso \u00e8 consentito esclusivamente con biglietto o abbonamento acquistato in prevendita.",
  },
  {
    icon: <MapPin className="w-5 h-5 text-green-400" />,
    question: 'Dove si trova Forte Sofia?',
    answer:
      'Forte Sofia si trova in Via Monte Novegno, Verona. Si accede da Via San Leonardo. Il forte \u00e8 raggiungibile a piedi, in bici o in auto.',
  },
  {
    icon: <Car className="w-5 h-5 text-amber-400" />,
    question: "C'\u00e8 parcheggio?",
    answer:
      "S\u00ec, il parcheggio \u00e8 gratuito ma i posti sono limitati. Ti consigliamo di arrivare in anticipo o di valutare il trasporto pubblico.",
  },
  {
    icon: <Bus className="w-5 h-5 text-blue-400" />,
    question: 'Come posso arrivare con i mezzi pubblici?',
    answer:
      "Puoi prendere le linee bus dirette all'Ospedale Maggiore. La sera \u00e8 attiva anche la linea 85.",
  },
  {
    icon: <Clock className="w-5 h-5 text-purple-400" />,
    question: 'A che ora inizia la musica?',
    answer:
      'Venerd\u00ec 19 e Sabato 20 settembre la musica inizia alle 19:00. Domenica 21 settembre si parte prima, alle 16:00.',
  },
  {
    icon: <Utensils className="w-5 h-5 text-orange-400" />,
    question: "Si pu\u00f2 mangiare al festival?",
    answer:
      "S\u00ec! Ogni sera \u00e8 disponibile la cena in loco preparata da Osteria Nosetta.",
  },
  {
    icon: <Users className="w-5 h-5 text-cyan-400" />,
    question: 'Posso fare il volontario?',
    answer:
      "Certo! Puoi unirti al team di volontari compilando il modulo disponibile sul sito di One Bridge To. Aiutaci a creare un Festival della Madonna!",
  },
  {
    icon: <Heart className="w-5 h-5 text-red-400" />,
    question: 'Dove vanno i fondi raccolti?',
    answer:
      'Il ricavato di tutte le serate va a sostegno di una clinica e di un centro comunitario nel campo profughi di Bajed Kandala, nel Kurdistan iracheno.',
  },
  {
    icon: <Heart className="w-5 h-5 text-red-400" />,
    question: 'Chi organizza Holy Festival?',
    answer:
      'Il festival \u00e8 organizzato da One Bridge To in collaborazione con RedLab, Osteria ai Preti e Santa Maria Craft Pub. La parte gastronomica \u00e8 curata da Osteria Nosetta.',
  },
];

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/5 transition-colors"
      >
        {faq.icon}
        <span className="flex-1 font-medium">{faq.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 text-gray-400 text-sm leading-relaxed ml-8">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen pb-20">
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12">
        <h1 className="font-cuanky text-5xl md:text-6xl mb-4">Domande Frequenti</h1>
        <p className="text-gray-400 max-w-xl">
          Tutto quello che devi sapere su Holy Festival 2025.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={i} faq={faq} />
          ))}
        </div>
      </section>
    </div>
  );
}
