"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { logout } from "@/features/auth/auth-service";

const subscribe = (onChange: () => void) => {
  window.addEventListener("plataforma:login-success", onChange);
  return () => window.removeEventListener("plataforma:login-success", onChange);
};

export function PlatformHeader() {
  const router = useRouter();
  const authenticated = useSyncExternalStore(subscribe, () => Boolean(window.sessionStorage.getItem("plataforma.accessToken")), () => false);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return <header className="site-header projects-header">
    <Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Plataforma Digital</small></span></Link>
    {authenticated ? <nav aria-label="Navegação autenticada" className="authenticated-nav"><Link href="/" className="text-link">Início</Link><Link href="/projects" className="text-link">Projetos</Link><Link href="/extension" className="text-link">Editais de extensão</Link><Link href="/projects/requests" className="text-link">Minhas solicitações</Link><button type="button" className="logout-button" onClick={() => void handleLogout()}>Sair</button></nav> : <nav aria-label="Navegação principal"><Link href="/projects" className="text-link">Projetos</Link><Link href="/login" className="btn btn-primary btn-small">Entrar</Link></nav>}
  </header>;
}
