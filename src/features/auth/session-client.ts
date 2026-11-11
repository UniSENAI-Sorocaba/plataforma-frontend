/** Cookie-based transport. Endpoint names must be supplied by the approved backend adapter. */
export class SessionExpiredError extends Error {
  constructor() { super("Sua sessão terminou. Entre novamente."); this.name = "SessionExpiredError"; }
}

type Options = {
  origin: string;
  refreshPath: string;
  logoutPath: string;
  onExpired: () => void;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

export class SessionClient {
  private readonly fetcher: typeof fetch;
  private readonly origin: string;
  private readonly refreshUrl: string;
  private readonly logoutUrl: string;
  private readonly timeoutMs: number;
  private refreshTask: Promise<void> | undefined;
  private endTask: Promise<void> | undefined;
  private generation = 0;
  private ended = false;

  constructor(private readonly options: Options) {
    this.origin = new URL(options.origin).origin;
    this.refreshUrl = this.localUrl(options.refreshPath);
    this.logoutUrl = this.localUrl(options.logoutPath);
    this.fetcher = options.fetcher ?? ((input, init) => fetch(input, init));
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  private localUrl(path: string) {
    const url = new URL(path, this.origin);
    if (url.origin !== this.origin || url.username || url.password) throw new TypeError("Sessão exige endpoint de mesma origem.");
    return url.href;
  }

  private send(request: Request) {
    return this.fetcher(new Request(request, {
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(this.timeoutMs)]),
      credentials: "same-origin", cache: "no-store", redirect: "error",
    }));
  }

  /** GET/HEAD may be replayed once. Mutations never replay automatically. */
  async request(path: string, init: RequestInit = {}): Promise<Response> {
    if (this.ended) throw new SessionExpiredError();
    const template = new Request(this.localUrl(path), init);
    const generation = this.generation;
    const response = await this.send(template.clone());
    if (this.ended) throw new SessionExpiredError();
    if (response.status !== 401 || !["GET", "HEAD"].includes(template.method)) return response;
    try {
      if (generation === this.generation) {
        this.refreshTask ??= this.refresh().finally(() => { this.refreshTask = undefined; });
        await this.refreshTask;
      }
      if (this.ended) throw new SessionExpiredError();
      const retried = await this.send(template.clone());
      if (this.ended || retried.status === 401) throw new SessionExpiredError();
      return retried;
    } catch {
      await this.logout();
      throw new SessionExpiredError();
    }
  }

  private async refresh() {
    const response = await this.send(new Request(this.refreshUrl, { method: "POST" }));
    if (!response.ok || this.ended) throw new SessionExpiredError();
    this.generation += 1;
  }

  /** Immediately blocks further reads; asks server to revoke/clear its cookie, then redirects. */
  logout(): Promise<void> {
    this.ended = true;
    this.endTask ??= (async () => {
      try { await this.send(new Request(this.logoutUrl, { method: "POST" })); }
      catch { /* Local UI still closes; server revocation is not guaranteed during an outage. */ }
      finally { this.options.onExpired(); }
    })();
    return this.endTask;
  }
}
