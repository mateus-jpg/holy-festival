import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import localFont from 'next/font/local'
import { AuthProvider } from '@/app/contexts/AuthContext';
import Navbar from "@/app/components/BrandNavBar";
import AmbientShapes from "@/app/components/AmbientShapes";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cuankyFont = localFont({
  src: './fonts/Cuanky.woff2',
  display: 'swap',
    variable: '--cuankyFont',
})

const promptRegular = localFont({
  src: './fonts/Prompt-Regular.woff2',
  display: 'swap',
  variable: '--promptRegular',
})
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Holy Festival 2026 | Forte Sofia, Verona",
  description: "Holy Festival 2026: musica indipendente, birra artigianale e solidarietà dall'11 al 13 settembre a Forte Sofia, Verona.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cuankyFont.variable} ${promptRegular.variable} ${promptRegular.className} antialiased`}
      >
        <a className="skip-link" href="#main-content">
          Salta al contenuto principale
        </a>
        <AmbientShapes />
        <AuthProvider>
          <Navbar/>
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
