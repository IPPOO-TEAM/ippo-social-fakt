// Minimal Sentry browser client — no SDK dependency, just the envelope
// endpoint. Keeps the bundle lean and avoids the SDK's auto-instrumentation
// surprises. Initialize once at app boot via initMonitoring().

interface SentryParts { url: string; key: string }

let parts: SentryParts | null = null;
let release = 'ippoo-web';
let environment = 'production';
let userTag: { id?: string; email?: string } | undefined;

function parseDsn(dsn: string): SentryParts | null {
  const m = dsn.match(/^(https?):\/\/([^@]+)@([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, proto, key, host, project] = m;
  return { url: `${proto}://${host}/api/${project}/store/`, key };
}

export function initMonitoring(opts: { dsn?: string; release?: string; environment?: string } = {}) {
  // DSN comes either from build-time env (Vite) or at runtime via window.
  const w = typeof window !== 'undefined' ? (window as Window & { SENTRY_DSN?: string }) : undefined;
  const dsn = opts.dsn
    || (typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env?.VITE_SENTRY_DSN : undefined)
    || w?.SENTRY_DSN;
  if (!dsn) return;
  const p = parseDsn(dsn);
  if (!p) return;
  parts = p;
  if (opts.release) release = opts.release;
  if (opts.environment) environment = opts.environment;

  // Global handlers — unhandled errors and promise rejections.
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => captureException(e.error ?? e.message, { source: 'window.onerror' }));
    window.addEventListener('unhandledrejection', (e) => captureException(e.reason, { source: 'unhandledrejection' }));
  }
}

export function setUser(user: { id?: string; email?: string } | undefined) {
  userTag = user;
}

export function captureException(err: unknown, ctx: Record<string, unknown> = {}): void {
  if (!parts) return;
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const payload = {
    event_id: (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    release, environment,
    exception: {
      values: [{
        type: err instanceof Error ? err.name : 'Error',
        value: message,
        stacktrace: stack ? { frames: parseStack(stack) } : undefined,
      }],
    },
    tags: { component: 'web' },
    user: userTag,
    extra: ctx,
    request: typeof location !== 'undefined' ? { url: location.href } : undefined,
  };
  // Fire and forget; never block UI on Sentry.
  const auth = `Sentry sentry_version=7, sentry_key=${parts.key}, sentry_client=ippoo-web/1.0`;
  fetch(parts.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sentry-Auth': auth },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

function parseStack(stack: string) {
  return stack.split('\n').slice(1, 30).map((line) => {
    const m = line.match(/at (?:(.+?) )?\(?(.+?):(\d+):(\d+)\)?$/);
    return m
      ? { function: m[1] || '?', filename: m[2], lineno: Number(m[3]), colno: Number(m[4]), in_app: true }
      : { function: line.trim(), in_app: true };
  });
}
