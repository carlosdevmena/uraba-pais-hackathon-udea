import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "URABÁ-PAÍS · Gestión de beneficiarios",
  description:
    "Prototipo de registro, vinculación, atención y seguimiento de beneficiarios — Hackathon URABÁ-PAÍS",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-b from-blue-50/60 via-white to-white text-slate-900">
        <NavBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
          Prototipo con datos ficticios · Hackathon URABÁ-PAÍS (COOPI, FADV, HIAS, HI)
        </footer>
      </body>
    </html>
  );
}
