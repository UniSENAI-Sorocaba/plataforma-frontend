"use client";

import React, { useState } from "react";
import type { Certificate, ValidationResult } from "./types";
import {
  DEMO_CERTIFICATES,
  validateCertificateHash,
  generateCertificateDownloadContent,
} from "./certificate-service";

export function CertificateViewer() {
  const [certificates] = useState<Certificate[]>(DEMO_CERTIFICATES);
  const [hashInput, setHashInput] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setValidationResult(null);

    // Simulate validation request
    setTimeout(() => {
      const result = validateCertificateHash(hashInput, certificates);
      setValidationResult(result);
      setIsValidating(false);
    }, 400);
  };

  const handleDownload = (cert: Certificate) => {
    const { filename, mimeType, content } = generateCertificateDownloadContent(cert);
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotification(`Certificado "${cert.title}" baixado com sucesso!`);
    setTimeout(() => setDownloadNotification(null), 4000);
  };

  const fillAndValidate = (hash: string) => {
    setHashInput(hash);
    setIsValidating(true);
    setTimeout(() => {
      const result = validateCertificateHash(hash, certificates);
      setValidationResult(result);
      setIsValidating(false);
      // scroll to validator
      const element = document.getElementById("validador-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 300);
  };

  return (
    <div className="cert-container">
      {/* Top Banner */}
      <section className="cert-hero" aria-labelledby="cert-hero-title">
        <span className="eyebrow">Extensão & Projetos Integradores</span>
        <h1 id="cert-hero-title" className="cert-hero-title">
          Certificados Acadêmicos Oficiais
        </h1>
        <p className="cert-hero-subtitle">
          Baixe seus certificados com comprovação digital ou valide a autenticidade de documentos emitidos pelo UniSENAI Sorocaba através do código hash ou QR Code.
        </p>
      </section>

      {/* Download Alert Notification */}
      {downloadNotification && (
        <div role="status" aria-live="polite" className="auth-alert auth-alert-success">
          <span className="auth-alert-icon" aria-hidden="true">✓</span>
          <div className="auth-alert-text">{downloadNotification}</div>
        </div>
      )}

      {/* Section 1: My Certificates */}
      <section className="cert-section" aria-labelledby="my-certs-title">
        <div className="cert-section-header">
          <div>
            <h2 id="my-certs-title" className="cert-section-title">
              Meus Certificados Disponíveis
            </h2>
            <p className="cert-section-subtitle">
              Certificados emitidos e disponíveis para download com assinatura e chave SHA-256.
            </p>
          </div>
          <span className="cert-count-badge">{certificates.length} documento(s)</span>
        </div>

        <div className="cert-grid">
          {certificates.map((cert) => (
            <article key={cert.id} className="cert-card" aria-labelledby={`cert-title-${cert.id}`}>
              <div className="cert-card-top">
                <span className={`category-badge category-${cert.category.toLowerCase()}`}>
                  {cert.category.replace("_", " ")}
                </span>
                <span className={`status-pill status-${cert.status.toLowerCase()}`}>
                  {cert.status === "VALID" ? "Válido" : "Revogado"}
                </span>
              </div>

              <h3 id={`cert-title-${cert.id}`} className="cert-card-title">
                {cert.title}
              </h3>

              <div className="cert-details">
                <p><strong>Carga Horária:</strong> {cert.hours} horas</p>
                <p><strong>Estudante:</strong> {cert.studentName} ({cert.studentRa})</p>
                <p><strong>Emissão:</strong> {cert.issueDate}</p>
                <p className="cert-issuer"><em>{cert.issuer}</em></p>
              </div>

              <div className="cert-hash-box">
                <span className="hash-label">Chave Hash (SHA-256):</span>
                <code className="hash-value">{cert.hash.substring(0, 24)}...</code>
              </div>

              <div className="cert-actions">
                <button
                  type="button"
                  className="btn-download"
                  onClick={() => handleDownload(cert)}
                  aria-label={`Baixar certificado ${cert.title}`}
                >
                  📥 Baixar Certificado
                </button>
                <button
                  type="button"
                  className="btn-check-hash"
                  onClick={() => fillAndValidate(cert.hash)}
                  aria-label={`Verificar autenticidade de ${cert.title}`}
                >
                  🔍 Validar Hash
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section 2: Public Authenticity Validator */}
      <section id="validador-section" className="cert-section cert-validator-card" aria-labelledby="validator-title">
        <div className="validator-header">
          <h2 id="validator-title" className="cert-section-title">
            Validação Pública por Hash e QR Code (FE-014 / BE-017)
          </h2>
          <p className="cert-section-subtitle">
            Informe o código hash alfanumérico impresso no rodapé do certificado ou o link completo do QR Code para validar a integridade junto ao registro oficial da instituição.
          </p>
        </div>

        <form onSubmit={handleValidate} className="validator-form" noValidate>
          <div className="form-group">
            <label htmlFor="hash-input" className="form-label">
              Código Hash SHA-256 ou URL do QR Code <span className="req">*</span>
            </label>
            <div className="validator-input-row">
              <input
                id="hash-input"
                type="text"
                required
                placeholder="Ex: a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"
                className="form-input validator-input"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                disabled={isValidating}
              />
              <button
                type="submit"
                className="btn-primary validator-submit-btn"
                disabled={isValidating || !hashInput.trim()}
              >
                {isValidating ? "Validando..." : "Validar Autenticidade"}
              </button>
            </div>
          </div>
        </form>

        {/* Validation Result Box */}
        {validationResult && (
          <div
            role="region"
            aria-live="polite"
            className={`validation-box validation-box-${validationResult.status.toLowerCase()}`}
          >
            {validationResult.isValid && validationResult.certificate ? (
              <div className="result-valid">
                <div className="result-header">
                  <span className="result-seal-icon" aria-hidden="true">🛡️</span>
                  <div>
                    <h3 className="result-title">Certificado Oficial Autêntico</h3>
                    <p className="result-timestamp">Verificado em: {validationResult.validatedAt}</p>
                  </div>
                </div>

                <div className="result-grid">
                  <div>
                    <strong>Atividade:</strong>
                    <p>{validationResult.certificate.title}</p>
                  </div>
                  <div>
                    <strong>Estudante:</strong>
                    <p>{validationResult.certificate.studentName}</p>
                  </div>
                  <div>
                    <strong>Registro Acadêmico (RA):</strong>
                    <p>{validationResult.certificate.studentRa}</p>
                  </div>
                  <div>
                    <strong>Carga Horária Comprovada:</strong>
                    <p>{validationResult.certificate.hours} horas complementares</p>
                  </div>
                  <div>
                    <strong>Data Oficial de Emissão:</strong>
                    <p>{validationResult.certificate.issueDate}</p>
                  </div>
                  <div>
                    <strong>Órgão Emissor:</strong>
                    <p>{validationResult.certificate.issuer}</p>
                  </div>
                </div>

                <div className="result-hash-confirm">
                  <strong>Hash Confirmado:</strong>
                  <code>{validationResult.certificate.hash}</code>
                </div>
              </div>
            ) : (
              <div className="result-invalid">
                <div className="result-header">
                  <span className="result-seal-icon" aria-hidden="true">⚠️</span>
                  <div>
                    <h3 className="result-title">Falha na Validação do Documento</h3>
                    <p className="result-desc">{validationResult.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

