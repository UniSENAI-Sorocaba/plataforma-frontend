"use client";

import { useRef, useState } from "react";
import { AppToast } from "@/components/app-toast";
import { initiateDeliverableUpload, uploadDeliverable } from "./participation-api";

export function DeliverableUpload({ projectId, periodId }: { projectId: string; periodId: string }) {
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; variant: "success" | "info" | "error" } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function submit(file: File | undefined) {
    if (!file) return;
    setSelectedFile(file); setBusy(true); setNotification({ title: "Preparando upload", message: "Estamos preparando o envio seguro do seu arquivo.", variant: "info" });
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const upload = await initiateDeliverableUpload(projectId, periodId, file);
      setNotification({ title: "Enviando arquivo", message: "Aguarde enquanto o arquivo é armazenado com segurança.", variant: "info" });
      await uploadDeliverable(upload, file, controller.signal);
      setNotification({ title: "Arquivo enviado", message: "Arquivo enviado com segurança.", variant: "success" });
    } catch (error) {
      if (controller.signal.aborted) setNotification({ title: "Upload cancelado", message: "O envio do arquivo foi cancelado.", variant: "info" });
      else setNotification({ title: "Não foi possível enviar", message: error instanceof Error ? error.message : "Não foi possível enviar o arquivo.", variant: "error" });
    } finally { abortRef.current = null; setBusy(false); }
  }

  const inputId = `deliverable-${periodId}`;
  const fileSize = selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "";

  return <div className="deliverable-upload">
    <div className="deliverable-upload-heading"><div><p className="form-label">Enviar entregável</p><p className="deliverable-upload-hint">Adicione o arquivo que comprova sua participação.</p></div><span className="deliverable-upload-step">01</span></div>
    <input id={inputId} className="sr-only" type="file" aria-label="Enviar entregável" onChange={(event) => void submit(event.target.files?.[0])} disabled={busy} accept=".pdf,.png,.jpg,.jpeg,.docx" />
    <label className={`deliverable-dropzone${busy ? " deliverable-dropzone-busy" : ""}`} htmlFor={inputId}>
      <span className="deliverable-dropzone-icon" aria-hidden="true">↑</span>
      <span className="deliverable-dropzone-copy"><strong>{busy ? "Enviando arquivo…" : selectedFile ? selectedFile.name : "Escolha um arquivo"}</strong><small>{busy ? "Aguarde enquanto o arquivo é protegido." : selectedFile ? `${fileSize} · Clique para trocar o arquivo` : "ou arraste aqui para começar"}</small></span>
      {!busy && <span className="deliverable-dropzone-action">Procurar arquivo</span>}
    </label>
    <p className="deliverable-upload-formats">PDF, PNG, JPG ou DOCX · até 20 MB</p>
    {busy && <button type="button" className="btn btn-secondary btn-small" onClick={() => abortRef.current?.abort()}>Cancelar upload</button>}
    {notification && <AppToast title={notification.title} message={notification.message} variant={notification.variant} onDismiss={() => setNotification(null)} />}
  </div>;
}
