import Link from "next/link";
import type { AuthUser } from "@/features/auth/auth-layout.mock";
import { NAV_ITEMS } from "@/features/auth/auth-layout.mock";

// SVGs por item de navegação
const ICONS: Record<string, React.ReactNode> = {
  "/aluno": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
    </svg>
  ),
  "/aluno/equipe": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  ),
  "/aluno/editais": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  ),
  "/aluno/upload": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  "/aluno/horas": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  "/aluno/certificados": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 21l4-3 4 3M7 9h10M7 13h6" />
    </svg>
  ),
  "/docente": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" />
    </svg>
  ),
  "/docente/projetos": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  ),
  "/docente/solicitacoes": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  "/docente/horas": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" /><path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
};

const FALLBACK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

interface NavSidebarProps {
  user: AuthUser;
  currentPath?: string;
}

export default function NavSidebar({ user, currentPath }: NavSidebarProps) {
  const items = NAV_ITEMS[user.role];
  const roleLabel =
    user.role === "aluno" ? "Navegação do Aluno"
    : user.role === "docente" ? "Navegação do Docente"
    : "Navegação";

  return (
    <aside className="sidebar" id="sidebar" aria-label="Navegação principal">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true">S</div>
        <div>
          <div className="sidebar__brand-name">UniSENAI</div>
          <div className="sidebar__brand-sub">Plataforma Acadêmica</div>
        </div>
      </div>

      {/* Nav */}
      <div>
        <p className="sidebar__nav-title" aria-hidden="true">{roleLabel.toUpperCase()}</p>
        <nav aria-label={roleLabel}>
          <ul className="sidebar__nav" role="list">
            {items.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar__link${isActive ? " sidebar__link--active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="sidebar__icon">
                      {ICONS[item.href] ?? FALLBACK_ICON}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="sidebar__spacer" />

      {/* Footer */}
      <div className="sidebar__footer">
        <strong>
          <span className="sidebar__dot" aria-hidden="true" />
          Ano Letivo 2025/1
        </strong>
        <small>Ciclo de Projetos Integradores</small>
      </div>
    </aside>
  );
}
