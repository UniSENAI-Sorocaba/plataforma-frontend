import { randomUUID } from "node:crypto";
type DemoSession = { expires: number; expired: boolean; rejectRefresh: boolean; reads: number; refreshes: number };
const sessions = new Map<string, DemoSession>();
const TTL = 10 * 60_000;
export const DEMO_COOKIE = "unisenai_demo_session";
export function createDemoSession(now = Date.now()) {
  for (const [id, session] of sessions) if (session.expires <= now) sessions.delete(id);
  if (sessions.size >= 500) throw new Error("Limite da demonstração atingido.");
  const id = randomUUID();
  sessions.set(id, { expires: now + TTL, expired: false, rejectRefresh: false, reads: 0, refreshes: 0 });
  return id;
}
export function findDemoSession(id: string | undefined, now = Date.now()) {
  if (!id) return undefined;
  const session = sessions.get(id);
  if (session && session.expires > now) return session;
  sessions.delete(id);
  return undefined;
}
export function deleteDemoSession(id: string | undefined) { if (id) sessions.delete(id); }
