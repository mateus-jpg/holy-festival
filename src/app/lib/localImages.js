import obt10Logo from '../../../public/images/obt-10-logo.webp';
import obtLogo from '../../../public/images/obt-logo.webp';
import ticket13June from '../../../public/tickets/13giu26.jpeg';
import ticket19June from '../../../public/tickets/19giu2026.jpeg';
import ticketSubscription from '../../../public/tickets/abbonamento.png';
import ticketSunday from '../../../public/tickets/dom21.png';
import ticketFlashSales from '../../../public/tickets/flashSales.jpg';
import ticketFlashSalesResized from '../../../public/tickets/flashSalesResized.jpg';
import ticketSaturday from '../../../public/tickets/sab20.png';
import ticketFriday from '../../../public/tickets/ven19.png';
import holySeptember11 from '../../../public/holy-2026/11-sep.jpeg';
import holySeptember12 from '../../../public/holy-2026/12-sep.jpeg';
import holySeptember13 from '../../../public/holy-2026/13-sep.jpeg';
import holySeptemberSubscription from '../../../public/holy-2026/abb-sep.jpeg';

function normalizeTicketImagePath(path) {
  return path.replace(/^\/images\/tickets\//, '/tickets/');
}

const localImageMap = {
  '/images/obt-10-logo.webp': obt10Logo,
  '/images/obt-logo.webp': obtLogo,
  '/tickets/13giu26.jpeg': ticket13June,
  '/tickets/19giu2026.jpeg': ticket19June,
  '/tickets/abbonamento.png': ticketSubscription,
  '/tickets/dom21.png': ticketSunday,
  '/tickets/flashSales.jpg': ticketFlashSales,
  '/tickets/flashSalesResized.jpg': ticketFlashSalesResized,
  '/tickets/sab20.png': ticketSaturday,
  '/tickets/ven19.png': ticketFriday,
  '/holy-2026/11-sep.jpeg': holySeptember11,
  '/holy-2026/12-sep.jpeg': holySeptember12,
  '/holy-2026/13-sep.jpeg': holySeptember13,
  '/holy-2026/abb-sep.jpeg': holySeptemberSubscription,
};

function normalizeLocalImagePath(src) {
  if (!src || typeof src !== 'string') {
    return '';
  }

  if (src.startsWith('/')) {
    return src.split(/[?#]/)[0];
  }

  try {
    const url = new URL(src);
    if (url.hostname === 'holy-festival.onebridgeto.com') {
      return url.pathname;
    }
  } catch {
    return src;
  }

  return src;
}

export function resolveLocalImage(src) {
  const normalizedPath = normalizeLocalImagePath(src);
  return localImageMap[normalizeTicketImagePath(normalizedPath)] || src;
}
