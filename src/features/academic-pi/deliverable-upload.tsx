"use client";

import { useRef, useState } from "react";
import { initiateDeliverableUpload, uploadDeliverable } from "./participation-api";

export function DeliverableUpload({ projectId, periodId }: { projectId: string; periodId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function submit(file: File | undefined) {
    if (!file) return;
    setBusy(true); setMessage("Preparando upload…");
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const upload = await initiateDeliverableUpload(projectId, periodId, file);
      setMessage("Enviando arquivo…");
      await uploadDeliverable(upload, file, controller.signal);
      setMessage("Arquivo enviado com segurança.");
    } catch (error) {
      if (controller.signal.aborted) setMessage("Upload cancelado.");
      else setMessage(error instanceof Error ? error.message : "Não foi possível enviar o arquivo.");
    } finally { abortRef.current = null; setBusy(false); }
  }

  return <div className="deliverable-upload">
    <label className="form-label" htmlFor={`deliverable-${periodId}`}>Enviar entregável
      <input id={`deliverable-${periodId}`} className="form-input" type="file" onChange={(event) => void submit(event.target.files?.[0])} disabled={busy} accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.zip,.docx,.xlsx" />
    </label>
    {busy && <button type="button" className="btn btn-secondary btn-small" onClick={() => abortRef.current?.abort()}>Cancelar upload</button>}
    {message && <p className={message.includes("não") ? "form-feedback form-feedback-error" : "form-feedback"} role={message.includes("não") ? "alert" : "status"}>{message}</p>}
  </div>;
}
