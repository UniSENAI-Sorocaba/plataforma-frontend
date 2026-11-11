import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionDemo } from "@/features/auth/session-demo";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Demonstração de sessão | UniSENAI", robots: { index: false, follow: false } };
export default function SessionPage() {
  if (process.env.ENABLE_SESSION_DEMO !== "true") notFound();
  return <main id="conteudo" className="narrow"><p className="eyebrow">FE-005 · ambiente simulado</p><h1>Continuidade com<br />saída segura.</h1><p className="lead">Teste como a interface reage à expiração da sessão e à falha de renovação.</p><div className="notice"><strong>Mock de desenvolvimento</strong><p>Os endpoints de autenticação reais ainda dependem do backend. Esta tela não recebe CPF, senha ou dados de alunos.</p></div><SessionDemo /></main>;
}
