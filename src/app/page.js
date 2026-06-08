'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, HeartHandshake, MapPin, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { eventContent } from '@/app/lib/eventContent';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-14 pt-12 text-center sm:pt-16">
        <Image
          src={eventContent.logo}
          alt="One Bridge To- 10 anni"
          width={360}
          height={202}
          className="mb-8 h-auto w-full max-w-[260px] object-contain sm:max-w-[340px]"
          priority
        />
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">
          {eventContent.shortName}
        </p>
        <h1 className="max-w-5xl text-5xl font-black leading-[0.95] text-[#012136] md:text-7xl">
          {eventContent.title}
        </h1>
        <p className="mt-6 max-w-3xl text-xl leading-relaxed text-[#012136]/78 md:text-2xl">
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

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/info"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#012136] px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-[#0a6f6a]"
          >
            <Calendar className="h-5 w-5" />
            Vedi programma
          </Link>
          <Link
            href={user ? '/shop' : '/auth'}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c5471f] px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-[#8f2f18]"
          >
            <Ticket className="h-5 w-5" />
            Prenota il posto
          </Link>
        </div>
      </section>

      <section className="border-y border-[#012136]/10 bg-[#012136] py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-6 gap-y-3 px-6 text-sm font-semibold uppercase tracking-[0.12em]">
          {eventContent.services.map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-14 md:grid-cols-3">
        {eventContent.highlights.map((item) => (
          <article key={item.title} className="rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#c5471f]/12 text-[#c5471f]">
              {item.title.includes('anni') ? <Users className="h-5 w-5" /> : <HeartHandshake className="h-5 w-5" />}
            </div>
            <h2 className="text-xl font-black text-[#012136]">{item.title}</h2>
            <p className="mt-3 leading-relaxed text-[#012136]/70">{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
