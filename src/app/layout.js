import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import localFont from 'next/font/local'
import { AuthProvider } from '@/app/contexts/AuthContext';
import Navbar from "@/app/components/NavBar";
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
  title: "GMR 2026 | One Bridge To-",
  description: "Giornata Mondiale del Rifugiato 2026 a Verona, a cura di One Bridge To-.",
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
