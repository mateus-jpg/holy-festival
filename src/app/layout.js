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
  title: "Holy Festival 2025",
  description: "Holy festival 2025",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cuankyFont.variable} ${promptRegular.className} antialiased`}
      >
        <AuthProvider>
            <Navbar/>
        {children}
        </AuthProvider>
      </body>
    </html>
  );
}
