import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CpaForm } from "@/features/cpa/cpa-form";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Protótipo CPA | UniSENAI", robots: { index: false, follow: false } };
export default function CpaPage() {
  if (process.env.ENABLE_PROTOTYPES !== "true") notFound();
  return <main id="conteudo" className="narrow"><p className="eyebrow">Escuta institucional</p><h1>Uma experiência<br />melhor começa aqui.</h1><p className="lead">Explore como uma avaliação institucional pode ser simples e acessível.</p><div className="notice"><strong>Protótipo · planejamento 2027.1</strong><p>Não é uma pesquisa em andamento. Não enviamos nem salvamos respostas. O anonimato de um sistema real dependerá de revisão de arquitetura e segurança.</p></div><CpaForm /></main>;
}
