import { describe, it, expect, vi } from "vitest";
import { SessionClient, SessionExpiredError } from "../../src/features/auth/session-client";
const origin = "https://example.test";
const ok = () => new Response("{}", { status: 200 });
const unauthorized = () => new Response(null, { status: 401 });
function setup(fetcher: typeof fetch) {
  const onExpired = vi.fn();
  return { client: new SessionClient({ origin, refreshPath: "/refresh", logoutPath: "/logout", onExpired, fetcher, timeoutMs: 50 }), onExpired };
}
const path = (input: RequestInfo | URL) => new URL((input as Request).url).pathname;

describe("session", () => {
  it("returns successful reads without refreshing, with safe cookie transport", async () => {
    const fetcher = vi.fn<typeof fetch>(async input => { const r = input as Request; expect(r.credentials).toBe("same-origin"); expect(r.cache).toBe("no-store"); expect(r.redirect).toBe("error"); return ok(); });
    expect((await setup(fetcher).client.request("/resource")).status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("refreshes once then replays once", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok());
    const { client, onExpired } = setup(fetcher);
    expect((await client.request("/resource")).ok).toBe(true);
    expect(fetcher.mock.calls.map(([r]) => path(r))).toEqual(["/resource", "/refresh", "/resource"]);
    expect(onExpired).not.toHaveBeenCalled();
  });
  it("deduplicates parallel refreshes", async () => {
    let refreshed = false;
    const fetcher = vi.fn<typeof fetch>(async input => {
      if (path(input) === "/refresh") { await new Promise(resolve => setTimeout(resolve, 5)); refreshed = true; return ok(); }
      return refreshed ? ok() : unauthorized();
    });
    const { client } = setup(fetcher);
    await Promise.all([client.request("/a"), client.request("/b"), client.request("/c")]);
    expect(fetcher.mock.calls.filter(([r]) => path(r) === "/refresh")).toHaveLength(1);
  });
  it("does not refresh again for a late 401 from the old generation", async () => {
    let release: (value: Response) => void = () => {};
    let count = 0;
    const delayed = new Promise<Response>(resolve => { release = resolve; });
    const fetcher = vi.fn<typeof fetch>(async input => {
      if (path(input) === "/slow" && count++ === 0) return delayed;
      if (path(input) === "/fast" && count++ === 1) return unauthorized();
      return ok();
    });
    const { client } = setup(fetcher);
    const slow = client.request("/slow");
    await client.request("/fast");
    release(unauthorized());
    await slow;
    expect(fetcher.mock.calls.filter(([r]) => path(r) === "/refresh")).toHaveLength(1);
  });
  it.each([401, 403, 500])("closes on refresh failure %i without looping", async status => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(new Response(null, { status })).mockResolvedValueOnce(ok());
    const { client, onExpired } = setup(fetcher);
    await expect(client.request("/resource")).rejects.toBeInstanceOf(SessionExpiredError);
    await expect(client.request("/resource")).rejects.toBeInstanceOf(SessionExpiredError);
    expect(fetcher).toHaveBeenCalledTimes(3); expect(onExpired).toHaveBeenCalledOnce();
  });
  it("closes when replay is still unauthorized", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(ok()).mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(ok());
    const { client, onExpired } = setup(fetcher);
    await expect(client.request("/resource")).rejects.toThrow(SessionExpiredError);
    expect(fetcher).toHaveBeenCalledTimes(4); expect(onExpired).toHaveBeenCalledOnce();
  });
  it("closes on network failure during refresh even if logout is unavailable", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(unauthorized()).mockRejectedValue(new Error("offline"));
    const { client, onExpired } = setup(fetcher);
    await expect(client.request("/resource")).rejects.toThrow(SessionExpiredError);
    expect(onExpired).toHaveBeenCalledOnce();
  });
  it("does not treat forbidden or transient server errors as expired sessions", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 403 }));
    const { client, onExpired } = setup(fetcher);
    expect((await client.request("/resource")).status).toBe(403);
    expect(fetcher).toHaveBeenCalledOnce(); expect(onExpired).not.toHaveBeenCalled();
  });
  it("does not replay mutations", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => unauthorized());
    expect((await setup(fetcher).client.request("/save", { method: "POST", body: "payload" })).status).toBe(401);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("rejects cross-origin resource and session endpoints", async () => {
    const { client } = setup(vi.fn());
    await expect(client.request("https://evil.test/resource")).rejects.toThrow(TypeError);
    expect(() => new SessionClient({ origin, refreshPath: "//evil.test/r", logoutPath: "/l", onExpired: vi.fn() })).toThrow(TypeError);
    await expect(client.request("https://user:secret@example.test/resource")).rejects.toThrow(TypeError);
  });
  it("logout is idempotent and blocks late refresh responses", async () => {
    let release: (value: Response) => void = () => {};
    let refreshing: () => void = () => {};
    const started = new Promise<void>(resolve => { refreshing = resolve; });
    const response = new Promise<Response>(resolve => { release = resolve; });
    const fetcher = vi.fn<typeof fetch>(async input => { if (path(input) === "/refresh") { refreshing(); return response; } return path(input) === "/logout" ? ok() : unauthorized(); });
    const { client, onExpired } = setup(fetcher);
    const read = client.request("/resource");
    await started; await Promise.all([client.logout(), client.logout()]); release(ok());
    await expect(read).rejects.toThrow(SessionExpiredError);
    expect(onExpired).toHaveBeenCalledOnce(); expect(fetcher.mock.calls.filter(([r]) => path(r) === "/logout")).toHaveLength(1);
  });
  it("does not return a response that arrives after logout", async () => {
    let release: (value: Response) => void = () => {};
    const pending = new Promise<Response>(resolve => { release = resolve; });
    const { client } = setup(vi.fn<typeof fetch>(async input => path(input) === "/logout" ? ok() : pending));
    const read = client.request("/resource"); await client.logout(); release(ok());
    await expect(read).rejects.toThrow(SessionExpiredError);
  });
  it("honors refresh timeout and ends locally", async () => {
    const fetcher = vi.fn<typeof fetch>(async input => {
      if (path(input) !== "/refresh") return path(input) === "/logout" ? ok() : unauthorized();
      return new Promise((_, reject) => (input as Request).signal.addEventListener("abort", () => reject(new Error("timeout")), { once: true }));
    });
    const { client, onExpired } = setup(fetcher);
    await expect(client.request("/resource")).rejects.toThrow(SessionExpiredError);
    expect(onExpired).toHaveBeenCalledOnce();
  });
});
