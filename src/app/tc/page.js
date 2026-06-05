import fs from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { Download, Mail, ScrollText, Ticket } from 'lucide-react';
import { eventContent } from '@/app/lib/eventContent';

export const metadata = {
  title: 'Termini e Condizioni | GMR 2026',
  description: 'Termini e Condizioni di vendita dei biglietti GMR 2026.',
};

function cleanMarkdownText(text = '') {
  return text
    .replace(/\\([\\`*_[\]{}()#+\-.!&])/g, '$1')
    .trim();
}

function unwrapMarkdownLine(text = '') {
  let cleanText = cleanMarkdownText(text);

  ['**', '*'].forEach((marker) => {
    if (cleanText.startsWith(marker) && cleanText.endsWith(marker)) {
      cleanText = cleanMarkdownText(cleanText.slice(marker.length, -marker.length));
    }
  });

  return cleanText;
}

function renderInlineMarkdown(text) {
  return text.split(/(\*\*.+?\*\*)/g).map((part, index) => {
    if (!part) {
      return null;
    }

    const strongMatch = part.match(/^\*\*(.+)\*\*$/);
    if (strongMatch) {
      return (
        <strong key={index} className="font-black text-[#012136]">
          {cleanMarkdownText(strongMatch[1])}
        </strong>
      );
    }

    return cleanMarkdownText(part);
  });
}

function parseTermsMarkdown(rawMarkdown) {
  const lines = rawMarkdown
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trim()
    .split('\n');

  const firstHeadingIndex = lines.findIndex((line) => line.trim().startsWith('#'));
  const introLines = lines.slice(0, firstHeadingIndex).filter((line) => line.trim());
  const bodyLines = lines.slice(firstHeadingIndex);
  const [title, subtitle, updatedAt] = introLines;
  const sections = [];
  let currentSection = null;
  let paragraphLines = [];

  const ensureSection = () => {
    if (!currentSection) {
      currentSection = { number: null, title: null, blocks: [] };
    }
  };

  const flushParagraph = () => {
    if (!paragraphLines.length || !currentSection) {
      paragraphLines = [];
      return;
    }

    currentSection.blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' '),
    });
    paragraphLines = [];
  };

  const addListItem = (text) => {
    ensureSection();
    flushParagraph();

    const lastBlock = currentSection.blocks[currentSection.blocks.length - 1];
    if (lastBlock?.type === 'list') {
      lastBlock.items.push(text);
      return;
    }

    currentSection.blocks.push({
      type: 'list',
      items: [text],
    });
  };

  bodyLines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (line.startsWith('#')) {
      const headingText = unwrapMarkdownLine(line.replace(/^#+\s+/, ''));
      const sectionMatch = headingText.match(/^(\d+)\.\s+(.+)$/);

      if (!sectionMatch) {
        return;
      }

      flushParagraph();

      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        number: sectionMatch[1],
        title: sectionMatch[2],
        blocks: [],
      };
      return;
    }

    if (!line) {
      flushParagraph();
      return;
    }

    if (line.startsWith('* ')) {
      addListItem(line.slice(2).trim());
      return;
    }

    ensureSection();
    paragraphLines.push(line);
  });

  flushParagraph();

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    title: unwrapMarkdownLine(title),
    subtitle: unwrapMarkdownLine(subtitle),
    updatedAt: unwrapMarkdownLine(updatedAt).replace(/^Ultimo aggiornamento:\s*/i, ''),
    sections,
  };
}

async function getTermsDocument() {
  const filePath = path.join(process.cwd(), 'public', 'TC_GMR26.md');
  const termsMarkdown = await fs.readFile(filePath, 'utf8');
  return parseTermsMarkdown(termsMarkdown);
}

export default async function TermsPage() {
  const terms = await getTermsDocument();

  return (
    <main className="min-h-screen pb-20">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-10 pt-14 text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">
          {eventContent.shortName}
        </p>
        <h1 className="text-4xl font-black leading-tight text-[#012136] md:text-6xl">
          {terms.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#012136]/74">
          {terms.subtitle}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#012136]/15 bg-white px-5 py-3 text-sm font-semibold text-[#012136] shadow-sm">
            <ScrollText className="h-4 w-4 text-[#c5471f]" aria-hidden="true" />
            Ultimo aggiornamento: {terms.updatedAt}
          </span>
          <Link
            href="/TC_GMR26.md"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-[#012136]/15 bg-white px-5 py-3 text-sm font-bold text-[#012136] shadow-sm transition-colors hover:bg-[#012136]/8"
          >
            Scarica Markdown
            <Download className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6">
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-lg border border-[#012136]/12 bg-[#012136] p-6 text-white shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black">Richieste relative ai biglietti</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/76">
              Per cancellazioni, rimborsi o modifiche del nominativo usa il contatto indicato nei termini.
            </p>
          </div>
          <Link
            href="mailto:fortesofia.aps@gmail.com"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#012136] transition-colors hover:bg-[#f1b84b]"
          >
            Scrivi email
            <Mail className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <article className="rounded-lg border border-[#012136]/12 bg-white shadow-sm">
          {terms.sections.map((section) => (
            <section key={`${section.number}-${section.title}`} className="border-b border-[#012136]/10 p-6 last:border-b-0 md:p-8">
              <div className="mb-5 flex items-start gap-4">
                {section.number && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c5471f]/12 text-sm font-black text-[#c5471f]">
                    {section.number}
                  </span>
                )}
                <h2 className="pt-1 text-2xl font-black leading-tight text-[#012136]">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-4 leading-relaxed text-[#012136]/74">
                {section.blocks.map((block, index) => {
                  if (block.type === 'list') {
                    return (
                      <ul key={index} className="space-y-2 pl-5">
                        {block.items.map((item) => (
                          <li key={item} className="list-disc pl-1">
                            {renderInlineMarkdown(item)}
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return <p key={index}>{renderInlineMarkdown(block.text)}</p>;
                })}
              </div>
            </section>
          ))}
        </article>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-lg border border-[#012136]/12 bg-white p-6 text-center shadow-sm sm:flex-row sm:text-left">
          <p className="max-w-2xl text-sm leading-relaxed text-[#012136]/68">
            I presenti T&C vengono accettati in fase di acquisto dei biglietti.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c5471f] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#8f2f18]"
          >
            Vai ai biglietti
            <Ticket className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
