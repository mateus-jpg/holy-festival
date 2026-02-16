'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Music, Heart, Users, Utensils } from 'lucide-react';

const artists = [
  {
    date: 'Venerd\u00ec 19 Settembre',
    startTime: '19:00',
    acts: [
      { name: 'Emilya Ndme', origin: 'Genova', genre: 'Synth/Post Punk', stage: 'Mainstage' },
      { name: 'Duck Baleno', origin: 'Verona', genre: 'Psychedelic', stage: 'Mainstage' },
      { name: 'Alex Fernet', origin: 'Vicenza', genre: 'Synth Pop/Nu Boogie', stage: 'Mainstage' },
      { name: 'Vera Moro', origin: 'Bruxelles', genre: 'DJ Set', stage: 'Bunker Room' },
    ],
  },
  {
    date: 'Sabato 20 Settembre',
    startTime: '19:00',
    acts: [
      { name: 'Sn\u00fcff', origin: 'Padova', genre: 'Garage/RnR', stage: 'Mainstage' },
      { name: 'Plastic Palm', origin: 'NYC/Torino', genre: 'Indie Garage', stage: 'Mainstage' },
      { name: 'Hearts Apart', origin: 'Vicenza', genre: 'Punk Rock', stage: 'Mainstage' },
      { name: 'Ritmica', origin: 'Verona', genre: 'DJ Set', stage: 'Bunker Room' },
    ],
  },
  {
    date: 'Domenica 21 Settembre',
    startTime: '16:00',
    acts: [
      { name: 'La Para', origin: 'Bologna', genre: 'Pop Lo-fi', stage: 'Mainstage' },
      { name: 'Le Altre di B', origin: 'Bologna', genre: 'Indie-Alternative', stage: 'Mainstage' },
    ],
  },
];

const organizers = [
  'One Bridge To',
  'RedLab',
  'Osteria ai Preti',
  'Santa Maria Craft Pub',
];

export default function InfoPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-16 pb-12">
        <h1 className="font-cuanky text-5xl md:text-7xl mb-4">Holy Festival 2025</h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
          Terza edizione del Festival della Madonna a Forte Sofia, Verona.
          Tre serate di musica, cibo e comunit&agrave; per una causa umanitaria.
        </p>
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-gray-300">
            <Calendar className="w-4 h-4" />
            19 &ndash; 21 Settembre 2025
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-gray-300">
            <MapPin className="w-4 h-4" />
            Forte Sofia, Verona
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold">La Nostra Missione</h2>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Il ricavato di tutte e tre le serate va a sostegno di una clinica e di un centro comunitario
            all&apos;interno del campo profughi di Bajed Kandala, nel Kurdistan iracheno. Holy Festival
            unisce organizzazioni locali, artisti e pubblico per una causa solidale, mescolando musica,
            buon cibo e spirito di comunit&agrave;.
          </p>
        </div>
      </section>

      {/* Line-up */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Music className="w-6 h-6 text-indigo-400" />
          <h2 className="text-3xl font-bold">Line-up</h2>
        </div>

        <div className="space-y-8">
          {artists.map((day) => (
            <div key={day.date} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold">{day.date}</h3>
                <span className="text-sm text-gray-400">dalle {day.startTime}</span>
              </div>
              <div className="divide-y divide-white/5">
                {day.acts.map((act) => (
                  <div key={act.name} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-lg">{act.name}</p>
                      <p className="text-sm text-gray-400">{act.origin} &middot; {act.genre}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full self-start sm:self-auto ${
                      act.stage === 'Mainstage'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {act.stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Biglietti */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-6">Biglietti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Ingresso singola serata</p>
            <p className="text-4xl font-bold mb-4">&euro;10</p>
            <Link
              href="/shop"
              className="inline-block bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Acquista
            </Link>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6 text-center">
            <p className="text-indigo-300 text-sm mb-2">Abbonamento 3 serate</p>
            <p className="text-4xl font-bold mb-4">&euro;20</p>
            <Link
              href="/shop"
              className="inline-block bg-indigo-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors"
            >
              Acquista
            </Link>
          </div>
        </div>
      </section>

      {/* Info pratiche */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-6">Info Pratiche</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold">Come Arrivare</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Forte Sofia, Via Monte Novegno, Verona (accesso da Via San Leonardo).
              Raggiungibile a piedi, in bici o in auto. Parcheggio gratuito ma limitato.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold">Cibo &amp; Bevande</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ogni sera sar&agrave; disponibile la cena in loco a cura di Osteria Nosetta.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold">Orari</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Venerd&igrave; e Sabato dalle 19:00. Domenica dalle 16:00.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold">Trasporto Pubblico</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Linee bus per Ospedale Maggiore. Linea serale 85.
            </p>
          </div>
        </div>
      </section>

      {/* Organizzatori */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Organizzato da</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {organizers.map((org) => (
            <span
              key={org}
              className="bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-gray-300"
            >
              {org}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
