import { parseWebVitalPayload } from "@/features/performance/web-vital-payload.mjs";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2048;

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return Response.json({ error: "Content-Type deve ser application/json." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Payload excede o limite permitido." }, { status: 413 });
  }

  if (!request.body) {
    return Response.json({ error: "Payload JSON inválido." }, { status: 400 });
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bodyBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bodyBytes += value.byteLength;
      if (bodyBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return Response.json({ error: "Payload excede o limite permitido." }, { status: 413 });
      }
      chunks.push(value);
    }
  } catch {
    return Response.json({ error: "Não foi possível ler o payload." }, { status: 400 });
  } finally {
    reader.releaseLock();
  }

  const bodyBuffer = new Uint8Array(bodyBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBuffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const body = new TextDecoder().decode(bodyBuffer);

  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return Response.json({ error: "Payload JSON inválido." }, { status: 400 });
  }

  const metric = parseWebVitalPayload(input);
  if (!metric) {
    return Response.json({ error: "Métrica Web Vitals inválida." }, { status: 400 });
  }

  console.info(JSON.stringify({
    event: "web_vital",
    ...metric,
    receivedAt: new Date().toISOString(),
  }));

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
