"use client";

import { FormEvent, useState } from "react";

type CertificateResult = { valid: boolean; certificate: { publicCode: string; projectId: string; periodId: string; studentId: string; status: string; issuedAt: string; validationUrl: string } };

export function PublicCertificateValidator() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CertificateResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim()) { setMessage("Informe o código público do certificado."); return; }
    setLoading(true); setMessage(""); setResult(null);
    try {
      const response = await fetch(`/api/v1/public/certificates/${encodeURIComponent(code.trim())}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(response.status === 404 ? "Certificado não encontrado." : "Não foi possível validar o certificado.");
      setResult(await response.json() as CertificateResult);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível validar o certificado."); }
    finally { setLoading(false); }
  }

  return <section className="management-panel" aria-labelledby="certificate-validator-title"><p className="eyebrow">Validação pública</p><h1 id="certificate-validator-title">Verifique um certificado</h1><p>Use o código público emitido pela plataforma. A consulta não exige login.</p><form className="auth-form" onSubmit={submit}><label className="form-label" htmlFor="certificate-code">Código do certificado<input id="certificate-code" className="form-input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="CERT-..." /></label><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Consultando…" : "Validar certificado"}</button></form>{message && <p className="projects-empty-copy" role="alert">{message}</p>}{result && <div className="participation-row" role="status"><strong>{result.valid ? "Certificado válido" : "Certificado revogado"}</strong><small>Código: {result.certificate.publicCode} · Status: {result.certificate.status}</small><small>Emitido em {new Date(result.certificate.issuedAt).toLocaleDateString("pt-BR")}</small></div>}</section>;
}
