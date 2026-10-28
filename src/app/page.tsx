import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="home-main">
      <div className="home-header">
        <p className="eyebrow">UniSENAI Sorocaba</p>
        <Link href="/certificados" className="btn-nav-cert">
          Consultar Certificados
        </Link>
      </div>
      <h1>Plataforma Digital</h1>
      <p>Projetos Integradores, Extensão Universitária e impacto institucional em um só lugar.</p>
    </main>
  );
}
