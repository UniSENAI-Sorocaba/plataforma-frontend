"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, UserRole } from "@/features/auth/types";

export function readSessionUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem("plataforma.accessToken");
  if (!token) return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem("plataforma.currentUser") ?? "{}") as Partial<AuthUser>;
    return { id: parsed.id || "current", name: parsed.name || "usuário", email: parsed.email, role: parsed.role || "ALUNO" };
  } catch {
    return { id: "current", name: "usuário", role: "ALUNO" };
  }
}

export const subscribeToSession = (onChange: () => void) => {
  window.addEventListener("plataforma:login-success", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("plataforma:login-success", onChange);
    window.removeEventListener("storage", onChange);
  };
};

export const sessionSnapshot = () => (typeof window === "undefined" ? null : window.sessionStorage.getItem("plataforma.accessToken"));
export const sessionUserSnapshot = () => (typeof window === "undefined" ? null : window.sessionStorage.getItem("plataforma.currentUser"));

export function RoleGuard({ allowed, children }: { allowed: UserRole[]; children: React.ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeToSession, sessionSnapshot, () => null);
  const user = readSessionUser();
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [router, user]);

  if (!token || !user) return <main className="auth-page-wrapper"><p className="projects-empty-copy">Verificando seu acesso…</p></main>;
  if (!allowed.includes(user.role)) return <main className="auth-page-wrapper"><section className="login-card" role="alert"><p className="eyebrow">Acesso restrito</p><h1>Você não pode acessar esta área.</h1><p>Seu perfil não possui permissão para esta tela.</p><button type="button" className="btn btn-primary" onClick={() => router.push("/")}>Voltar ao início</button></section></main>;
  return <>{children}</>;
}
