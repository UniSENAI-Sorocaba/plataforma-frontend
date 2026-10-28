"use client";
import { useRef, useState } from "react";
import { SessionClient, SessionExpiredError } from "./session-client";
export function SessionDemo() {
  const client = useRef<SessionClient | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Inicie uma sessão fictícia para testar. Nenhuma credencial é necessária.");
  const [refreshes, setRefreshes] = useState(0);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); }
    catch (error) { setMessage(error instanceof SessionExpiredError ? error.message : "Não foi possível concluir. Tente novamente."); }
    finally { setBusy(false); }
  };
  const post = async (action: string) => {
    const response = await fetch(`/api/demo/session/${action}`, { method: "POST", cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error("Demonstração indisponível.");
  };
  const read = async () => {
    if (!client.current) throw new SessionExpiredError();
    const response = await client.current.request("/api/demo/session/resource");
    if (!response.ok) throw new Error("Recurso indisponível.");
    const result = await response.json();
    setRefreshes(result.refreshes);
    setMessage(result.message);
  };
  return <section className="panel session-panel"><div className="session-status"><span className={active ? "status-dot active" : "status-dot"} /><strong>{active ? "Sessão de demonstração ativa" : "Sem sessão de demonstração"}</strong></div><p role="status" aria-live="polite">{message}</p><p>Renovações nesta sessão: <strong data-testid="refresh-count">{refreshes}</strong></p><div className="demo-actions">
    {!active ? <button disabled={busy} onClick={() => void run(async () => { await post("login"); client.current = new SessionClient({ origin: window.location.origin, refreshPath: "/api/demo/session/refresh", logoutPath: "/api/demo/session/logout", onExpired: () => { setActive(false); setRefreshes(0); setMessage("Sessão encerrada. Entre novamente para continuar."); } }); setActive(true); setRefreshes(0); setMessage("Sessão fictícia iniciada. Agora você pode testar os cenários."); })}>Iniciar sessão fictícia</button> : <>
    <button disabled={busy} onClick={() => void run(read)}>Consultar recurso protegido</button>
    <button className="secondary" disabled={busy} onClick={() => void run(async () => { await post("expire"); await read(); })}>Simular expiração e renovar</button>
    <button className="secondary" disabled={busy} onClick={() => void run(async () => { await post("reject-refresh"); await read(); })}>Simular falha de renovação</button>
    <button className="secondary" disabled={busy} onClick={() => void run(async () => { await client.current?.logout(); })}>Sair</button></>}
    </div>{busy ? <p role="status">Processando…</p> : null}<p className="footnote">A demonstração não concede acesso ao sistema acadêmico. Cookie HttpOnly, dados sintéticos e expiração em dez minutos. Não há tokens em armazenamento do navegador.</p></section>;
}
