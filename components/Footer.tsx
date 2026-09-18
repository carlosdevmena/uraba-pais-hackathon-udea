import Image from "next/image";
import { ExternalLink, Mail, ShieldCheck } from "lucide-react";

const FINANCIADORES = [
  {
    nombre: "Ministero degli Affari Esteri e della Cooperazione Internazionale",
    src: "/aliado-affari-esteri.jpeg",
    href: "https://www.esteri.it",
  },
  {
    nombre: "Agenzia Italiana per la Cooperazione allo Sviluppo (AICS)",
    src: "/aliado-aics.jpeg",
    href: "https://www.aics.gov.it",
  },
];

const CONSORCIO = [
  { nombre: "COOPI · Cooperazione Internazionale", src: "/aliado-coopi.jpeg", href: "https://coopi.org" },
  { nombre: "Fondazione L'Albero della Vita", src: "/aliado-fadv.jpeg", href: "https://www.alberodellavita.org" },
  { nombre: "Fundación HIAS Colombia", src: "/aliado-hias.jpeg", href: "https://www.hias.org" },
  { nombre: "Humanity & Inclusion (HI)", src: "/aliado-hi.jpeg", href: "https://www.hi.org" },
];

function IconoInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoLinkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="10" x2="7" y2="16" />
      <circle cx="7" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <path d="M11 16v-4a2 2 0 0 1 4 0v4" />
      <line x1="11" y1="10" x2="11" y2="16" />
    </svg>
  );
}

function IconoFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v4h2v6h4v-6h2.5l.5-4H13V8a1 1 0 0 1 1-1h2z" />
    </svg>
  );
}

const REDES_FADV = [
  { href: "https://www.instagram.com/fadvcolombia", label: "Instagram", Icon: IconoInstagram },
  { href: "https://www.linkedin.com/company/l'albero-della-vita/", label: "LinkedIn", Icon: IconoLinkedin },
  {
    href: "https://www.facebook.com/people/Fundaci%C3%B3n-LAlbero-Della-Vita-Colombia/61567179792508/",
    label: "Facebook",
    Icon: IconoFacebook,
  },
  { href: "mailto:fadvcolombia@alberodellavita.org", label: "Correo", Icon: Mail },
];

function BloqueLogos({ titulo, entidades }: { titulo: string; entidades: typeof FINANCIADORES }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">{titulo}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {entidades.map((a) => (
          <a
            key={a.nombre}
            href={a.href}
            target="_blank"
            rel="noreferrer noopener"
            title={a.nombre}
            aria-label={a.nombre}
            className="flex h-14 w-28 items-center justify-center rounded-lg bg-white p-2 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-accent-400"
          >
            <Image src={a.src} alt={a.nombre} width={160} height={80} className="h-full w-full object-contain" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-brand-700 text-brand-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-8 sm:grid-cols-2">
          <BloqueLogos titulo="Financiador" entidades={FINANCIADORES} />
          <BloqueLogos titulo="Consorcio ejecutor" entidades={CONSORCIO} />
        </div>

        <div className="grid gap-8 border-t border-brand-600 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Entidad líder</p>
            <a
              href="https://coopi.org"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 inline-flex items-center gap-1.5 text-lg font-semibold text-white transition hover:underline"
            >
              COOPI · Cooperazione Internazionale
              <ExternalLink size={15} />
            </a>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-200">
              Redes — L&apos;Albero della Vita
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {REDES_FADV.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`FADV en ${label}`}
                  className="flex items-center gap-1 text-xs text-amber-400 transition hover:text-amber-300"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-white/90">{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Consorcio</p>
            <ul className="mt-1 flex flex-col gap-0.5 text-sm text-brand-100">
              {CONSORCIO.slice(1).map((a) => (
                <li key={a.nombre}>{a.nombre}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Territorio del proyecto</p>
            <p className="mt-1 text-sm text-brand-100">Apartadó, Turbo y Necoclí — Urabá antioqueño.</p>
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
