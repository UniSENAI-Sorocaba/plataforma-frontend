import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, createDemoSession, deleteDemoSession, findDemoSession } from "@/features/demo/session-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { "Cache-Control": "no-store, private" } });
const cookieOptions = (request: NextRequest) => ({ httpOnly: true, sameSite: "strict" as const, secure: request.nextUrl.protocol === "https:", path: "/api/demo/session", maxAge: 600 });
function clear(request: NextRequest, status = 200) {
  const response = json({ message: "Sessão de demonstração encerrada." }, status);
  response.cookies.set(DEMO_COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}
export async function GET(request: NextRequest, context: Context) {
  if (process.env.ENABLE_SESSION_DEMO !== "true") return json({ message: "Não encontrado." }, 404);
  const { action } = await context.params;
  if (action !== "resource") return json({ message: "Não encontrado." }, 404);
  const session = findDemoSession(request.cookies.get(DEMO_COOKIE)?.value);
  if (!session) return clear(request, 401);
  session.reads += 1;
  if (session.expired) return json({ message: "Sessão de demonstração expirada." }, 401);
  return json({ message: "Conteúdo protegido de demonstração disponível.", reads: session.reads, refreshes: session.refreshes });
}
export async function POST(request: NextRequest, context: Context) {
  if (process.env.ENABLE_SESSION_DEMO !== "true") return json({ message: "Não encontrado." }, 404);
  if (request.headers.get("origin") !== `${request.nextUrl.protocol}//${request.headers.get("host")}`) return json({ message: "Origem não permitida." }, 403);
  const { action } = await context.params;
  const id = request.cookies.get(DEMO_COOKIE)?.value;
  if (action === "login") {
    deleteDemoSession(id);
    try {
      const response = json({ message: "Sessão fictícia iniciada." });
      response.cookies.set(DEMO_COOKIE, createDemoSession(), cookieOptions(request));
      return response;
    } catch { return json({ message: "Demonstração ocupada. Tente mais tarde." }, 503); }
  }
  if (action === "logout") { deleteDemoSession(id); return clear(request); }
  const session = findDemoSession(id);
  if (!session) return clear(request, 401);
  if (action === "expire" || action === "reject-refresh") {
    session.expired = true;
    session.rejectRefresh = action === "reject-refresh";
    return json({ message: "Cenário de expiração preparado." });
  }
  if (action === "refresh") {
    if (session.rejectRefresh) { deleteDemoSession(id); return clear(request, 401); }
    session.expired = false;
    session.refreshes += 1;
    return json({ message: "Sessão fictícia renovada." });
  }
  return json({ message: "Não encontrado." }, 404);
}
