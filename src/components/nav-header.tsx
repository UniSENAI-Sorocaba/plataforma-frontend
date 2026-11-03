import Link from "next/link";
import type { AuthUser } from "@/features/auth/auth-layout.mock";

interface NavHeaderProps {
  user: AuthUser;
}

export default function NavHeader({ user }: NavHeaderProps) {
  return (
    <header className="nav-header" role="banner">
      <div className="nav-header__brand">
        <Link href="/" aria-label="UniSENAI Sorocaba — página inicial">
          <span className="nav-header__logo" aria-hidden="true">UniSENAI</span>
        </Link>
        <span className="nav-header__subtitle">Plataforma Digital</span>
      </div>

      <div className="nav-header__user">
        <span className="nav-header__name" aria-label={`Usuário logado: ${user.name}`}>
          {user.name}
        </span>
        <span className="nav-header__role">
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
        {/* TODO AUTH-08-BE: substituir por ação real de logout */}
        <button
          type="button"
          className="nav-header__logout"
          aria-label="Sair da conta"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
