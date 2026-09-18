import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import PageFade from "@/components/PageFade";
import AiAssistant from "@/components/AiAssistant";
import { obtenerRolActivo } from "@/app/login/actions";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const rol = await obtenerRolActivo();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col overflow-x-hidden bg-gradient-to-b from-brand-50/40 via-mint-50/20 to-sky-50/30 text-slate-900">
        <div className="pointer-events-none fixed -left-32 top-24 -z-10 h-80 w-80 rounded-full bg-mint-100/40 blur-3xl" />
        <div className="pointer-events-none fixed -right-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-accent-100/30 blur-3xl" />
        <div className="pointer-events-none fixed -left-16 bottom-0 -z-10 h-64 w-64 rounded-full bg-brand-100/40 blur-3xl" />
        <NavBar rol={rol} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-16">
          <PageFade>{children}</PageFade>
        </main>
        <Footer />
        {rol && <AiAssistant />}
      </body>
    </html>
  );
}
