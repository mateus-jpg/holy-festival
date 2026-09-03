'use client';

import Link from 'next/link';
import { ArrowUpRight, Calendar, HeartHandshake, MapPin, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { eventContent } from '@/app/lib/eventContent';

export default function Home() {
  const { user } = useAuth();
  const serviceItems = [...eventContent.services, ...eventContent.services];

  return (
    <main className="min-h-[calc(100dvh-4.5rem)] overflow-hidden">
      <section className="hero-stage">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="relative z-10 max-w-2xl">
            <p className="site-kicker mb-5 flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d2ff00] shadow-[0_0_0_4px_rgba(210,255,0,0.16)]" />
              Verona / Forte Sofia / 2026
            </p>
            <h1 className="display-heading max-w-xl text-6xl text-[#fffaff] sm:text-7xl lg:text-8xl">
              Musica
              <span className="block text-[#d2ff00]">senza confini.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#d7c5e2] sm:text-xl">
              {eventContent.title}. {eventContent.tagline}
            </p>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#c8faf7]">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#ff0053]" aria-hidden="true" />
                {eventContent.dateRange}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#ff0053]" aria-hidden="true" />
                {eventContent.venue}
              </span>
            </div>

            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link href="/info" className="site-button site-button-secondary">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Vedi programma
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={user ? '/shop' : '/auth'} className="site-button site-button-primary">
                <Ticket className="h-4 w-4" aria-hidden="true" />
                Prenota il posto
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[30rem] lg:mr-3">
            <div className="absolute -right-4 top-5 z-20 flex h-20 w-20 rotate-12 items-center justify-center rounded-full bg-[#d2ff00] text-center font-black uppercase leading-[0.8] text-[#170020] shadow-[5px_5px_0_#ff0053] sm:-right-8 sm:h-24 sm:w-24">
              <span>
                HOLY
                <br />
                4ª EDIZIONE
              </span>
            </div>
            <figure className="hero-poster aspect-[4/4.8]">
              <div className="hero-poster-art" aria-hidden="true">
                <span className="hero-poster-orbit" />
                <span className="hero-poster-triangle" />
                <span className="hero-poster-spark hero-poster-spark--one" />
                <span className="hero-poster-spark hero-poster-spark--two" />
                <span className="hero-poster-label">11—13 / 09 / 26</span>
                <span className="hero-poster-wordmark">HOLY</span>
                <span className="hero-poster-subtitle">Festival<br />Verona</span>
              </div>
              <figcaption className="absolute inset-x-5 bottom-5 z-10 flex items-end justify-between gap-4 text-[#fffaff]">
                <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#c8faf7]">
                  One Bridge To-
                  <br />
                  presenta
                </span>
                <span className="display-heading text-right text-3xl text-[#ff0053] [text-shadow:2px_2px_0_#d2ff00]">
                  Holy
                  <br />
                  Festival
                </span>
              </figcaption>
            </figure>
            <div className="absolute -bottom-5 -left-4 h-20 w-20 rounded-full border border-[#c8faf7]/50 sm:-left-8" />
            <div className="absolute -bottom-3 left-14 h-9 w-16 rotate-[-18deg] border-t-4 border-[#d2ff00] sm:left-16" />
          </div>
        </div>
      </section>

      <section className="service-strip" aria-label="Cosa trovi al festival">
        <div className="service-strip-track">
          {serviceItems.map((service, index) => (
            <span key={`${service}-${index}`} className="service-strip-item" aria-hidden={index >= eventContent.services.length}>
              {service}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:py-28">
        <div className="max-w-md">
          <p className="site-kicker mb-5">Holy Festival / 4ª edizione</p>
          <h2 className="display-heading text-5xl text-[#fffaff] sm:text-6xl">
            Musica indipendente.
            <span className="block text-[#ff0053]">Solidarietà concreta.</span>
          </h2>
          <p className="mt-6 leading-relaxed text-[#d7c5e2]">
            Cinema, teatro, talk e laboratori per attraversare confini, cura e seconde generazioni.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {eventContent.highlights.map((item, index) => {
            const Icon = index === 0 ? Users : HeartHandshake;
            const panelClass = index === 0 ? 'feature-panel feature-panel--lime sm:col-span-2' : index === 1 ? 'feature-panel--cyan' : 'feature-panel--magenta';

            return (
              <article key={item.title} className={panelClass}>
                <Icon className="mb-9 h-7 w-7" aria-hidden="true" />
                <h3 className="display-heading text-3xl sm:text-4xl">{item.title}</h3>
                <p className="mt-4 max-w-prose text-sm leading-relaxed opacity-80">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-6 mb-20 border border-[#c8faf7]/30 bg-[#351249] sm:mx-8 lg:mx-auto lg:max-w-7xl">
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:p-14">
          <div>
            <p className="site-kicker mb-5">Forte Sofia / Verona</p>
            <h2 className="display-heading max-w-2xl text-5xl text-[#fffaff] sm:text-6xl">
              Vieni, balla,
              <span className="block text-[#d2ff00]">fai la differenza.</span>
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-[#d7c5e2]">
              Tutte le informazioni pratiche, il programma e gli ingressi disponibili sono raccolti qui.
            </p>
          </div>
          <Link href={user ? '/shop' : '/auth'} className="site-button site-button-primary justify-self-start lg:justify-self-end">
            <Ticket className="h-4 w-4" aria-hidden="true" />
            Prenota il posto
          </Link>
        </div>
      </section>
    </main>
  );
}
