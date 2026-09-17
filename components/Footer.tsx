import Image from "next/image";
import { ExternalLink, Link2, Mail, ShieldCheck } from "lucide-react";

const OTROS_ALIADOS = [
  "Fundación HIAS Colombia",
  "Humanity & Inclusion (HI)",
  "Agenzia Italiana per la Cooperazione allo Sviluppo (AICS) / Ambasciata d'Italia Bogotá",
];

const REDES_FADV = [
  { href: "https://www.instagram.com/fadvcolombia", label: "Instagram", icon: Link2 },
  {
    href: "https://www.linkedin.com/company/l'albero-della-vita/",
    label: "LinkedIn",
    icon: Link2,
  },
  {
    href: "https://www.facebook.com/people/Fundaci%C3%B3n-LAlbero-Della-Vita-Colombia/61567179792508/",
    label: "Facebook",
    icon: Link2,
  },
  { href: "mailto:fadvcolombia@alberodellavita.org", label: "Correo", icon: Mail },
];

export default function Footer() {
  return (
    <footer className="bg-brand-700 text-brand-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Entidad líder</p>
            <a
              href="https://coopi.org"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 inline-flex items-center gap-1.5 text-lg font-semibold text-white hover:underline"
            >
              COOPI · Cooperazione Internazionale
              <ExternalLink size={15} />
            </a>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Aliado ejecutor</p>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-white p-2">
              <Image src="/fadv-logo.png" alt="Fondazione L'Albero della Vita" width={110} height={28} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              {REDES_FADV.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`FADV en ${label}`}
                  className="flex items-center gap-1 text-xs text-brand-100 hover:text-white hover:underline"
                >
                  <Icon size={14} />
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Otros aliados</p>
            <ul className="mt-1 flex flex-col gap-0.5 text-sm text-brand-100">
              {OTROS_ALIADOS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-2 border-t border-brand-600 pt-5 text-xs text-brand-200">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <p>
            Prototipo con datos completamente ficticios. La información real de beneficiarios es
            confidencial y se trata bajo criterios de protección de datos y dignidad humanitaria.
          </p>
        </div>
      </div>
    </footer>
  );
}
