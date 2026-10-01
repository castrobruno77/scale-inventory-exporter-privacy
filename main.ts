import nacl from "npm:tweetnacl@1.0.3";

type ProbeResult = {
  source: string;
  ok: boolean;
  status: number | null;
  latency_ms: number;
  count: number | null;
  next_cursor: boolean | null;
  rate_headers: Record<string, string>;
  freshness: {
    newest_timestamp: string | null;
    oldest_timestamp: string | null;
  };
  fields: {
    price: boolean;
    exact_float: boolean;
    paint_seed: boolean;
    paint_index: boolean;
    inspect: boolean;
  };
  sample?: Record<string, unknown> | null;
  error?: string | null;
};

function envAny(...names: string[]): string | undefined {
  for (const name of names) {
    const v = Deno.env.get(name);
    if (v && v.trim()) return v.trim();
  }
}

function rateHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of headers.entries()) {
    const key = k.toLowerCase();
    if (
      key.includes("rate") ||
      key.includes("limit") ||
      key.includes("remaining") ||
      key.includes("retry-after")
    ) out[k] = v;
  }
  return out;
}

function arrFrom(body: any): any[] {
  if (Array.isArray(body)) return body;
  for (const key of ["listings", "items", "data", "objects", "results"]) {
    if (Array.isArray(body?.[key])) return body[key];
  }
  return [];
}

function timestamps(items: any[]): { newest_timestamp: string | null; oldest_timestamp: string | null } {
  const vals: number[] = [];
  for (const it of items) {
    const candidates = [
      it?.created_at, it?.createdAt, it?.updated_at, it?.updatedAt,
      it?.timestamp, it?.date, it?.time
    ];
    for (const x of candidates) {
      if (typeof x === "string") {
        const t = Date.parse(x);
        if (Number.isFinite(t)) vals.push(t);
      } else if (typeof x === "number") {
        const t = x > 1e12 ? x : x * 1000;
        if (Number.isFinite(t)) vals.push(t);
      }
    }
  }
  if (!vals.length) return { newest_timestamp: null, oldest_timestamp: null };
  return {
    newest_timestamp: new Date(Math.max(...vals)).toISOString(),
    oldest_timestamp: new Date(Math.min(...vals)).toISOString(),
  };
}

function safeFields(item: any, source: string): ProbeResult["fields"] {
  const cs2 = item?.attributes?.cs2 ?? {};
  return {
    price: item?.price != null || item?.priceCents != null || item?.price_cents != null,
    exact_float:
      item?.cs_paint_wear != null ||
      item?.float != null ||
      cs2?.float != null,
    paint_seed:
      item?.cs_paint_seed != null ||
      item?.paint_seed != null ||
      item?.paintSeed != null ||
      cs2?.paintSeed != null,
    paint_index:
      item?.cs_paint_index != null ||
      item?.paint_index != null ||
      item?.paintIndex != null ||
      cs2?.paintIndex != null,
    inspect:
      item?.cs_inspect_link != null ||
      item?.inspect != null ||
      item?.inspect_link != null ||
      cs2?.inspectInGameUri != null,
  };
}

function safeSample(item: any, source: string): Record<string, unknown> | null {
  if (!item) return null;
  if (source === "csdeals") {
    return {
      id: item.id ?? null,
      market_hash_name: item.market_hash_name ?? null,
      price: item.price ?? null,
      created_at: item.created_at ?? null,
      float: item.cs_paint_wear ?? null,
      paint_seed: item.cs_paint_seed ?? null,
      paint_index: item.cs_paint_index ?? null,
    };
  }
  if (source === "waxpeer") {
    return {
      item_id: item.item_id ?? item.id ?? null,
      name: item.name ?? item.market_hash_name ?? null,
      price: item.price ?? null,
      float: item.float ?? null,
      phase: item.phase ?? null,
    };
  }
  if (source === "dmarket") {
    const cs2 = item?.attributes?.cs2 ?? {};
    return {
      offerId: item.offerId ?? null,
      title: item?.attributes?.title ?? item?.title ?? null,
      priceCents: item.priceCents ?? null,
      createdAt: item.createdAt ?? null,
      float: cs2.float ?? null,
      paintSeed: cs2.paintSeed ?? null,
      paintIndex: cs2.paintIndex ?? null,
      phase: cs2.phase ?? null,
      offerType: item.offerType ?? null,
    };
  }
  return null;
}

async function fetchJson(url: string, init: RequestInit, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { body = { raw_preview: text.slice(0, 500) }; }
    return { res, body, latency_ms: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}

async function probeCsDeals(): Promise<ProbeResult> {
  const key = envAny("CSDEALS_API_KEY", "CS_DEALS_API_KEY", "CSD_API_KEY");
  if (!key) return missing("csdeals", "missing API key environment variable");
  const url = "https://api.cs.deals/public/v1/listings?app_id=730&limit=500";
  try {
    const { res, body, latency_ms } = await fetchJson(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    const items = arrFrom(body);
    return {
      source: "csdeals", ok: res.ok, status: res.status, latency_ms,
      count: items.length,
      next_cursor: body?.next_cursor != null,
      rate_headers: rateHeaders(res.headers),
      freshness: timestamps(items),
      fields: safeFields(items[0], "csdeals"),
      sample: safeSample(items[0], "csdeals"),
      error: res.ok ? null : (body?.message ?? body?.error ?? `HTTP ${res.status}`),
    };
  } catch (e) { return failed("csdeals", e); }
}

async function probeWaxpeer(): Promise<ProbeResult> {
  const key = envAny("WAXPEER_API_KEY", "WAXPEER_KEY", "WAXPEER_API");
  if (!key) return missing("waxpeer", "missing API key environment variable");
  const u = new URL("https://api.waxpeer.com/v2/get-items-list");
  u.searchParams.set("game", "csgo");
  u.searchParams.set("limit", "100");
  u.searchParams.set("api", key);
  try {
    const { res, body, latency_ms } = await fetchJson(u.toString(), {
      headers: { Accept: "application/json" },
    });
    const items = arrFrom(body);
    return {
      source: "waxpeer", ok: res.ok, status: res.status, latency_ms,
      count: items.length,
      next_cursor: (body?.next_cursor ?? body?.cursor) != null,
      rate_headers: rateHeaders(res.headers),
      freshness: timestamps(items),
      fields: safeFields(items[0], "waxpeer"),
      sample: safeSample(items[0], "waxpeer"),
      error: res.ok ? null : (body?.msg ?? body?.message ?? body?.error ?? `HTTP ${res.status}`),
    };
  } catch (e) { return failed("waxpeer", e); }
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]+$/.test(clean) || clean.length % 2) throw new Error("invalid hex key format");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function dmarketSecretKey(hex: string): Uint8Array {
  const raw = hexToBytes(hex);
  if (raw.length === nacl.sign.secretKeyLength) return raw;
  if (raw.length === nacl.sign.seedLength) return nacl.sign.keyPair.fromSeed(raw).secretKey;
  throw new Error(`unexpected DMarket secret key length: ${raw.length} bytes`);
}

async function probeDMarket(): Promise<ProbeResult> {
  const publicKey = envAny("DMARKET_PUBLIC_KEY", "DMARKET_API_PUBLIC_KEY", "DMARKET_KEY");
  const secretHex = envAny("DMARKET_SECRET_KEY", "DMARKET_API_SECRET_KEY", "DMARKET_SECRET");
  if (!publicKey || !secretHex) return missing("dmarket", "missing DMarket public/secret key environment variable");

  const path = "/marketplace-api/v2/offers";
  const params = new URLSearchParams();
  params.set("gameId", "a8db");
  params.set("title", "AK-47 | Redline");
  params.set("treeFilters", "exterior=field-tested");
  params.set("orderBy", "price");
  params.set("orderDir", "asc");
  params.set("limit", "100");
  params.set("offerType", "all");

  const query = params.toString();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const unsigned = `GET${path}?${query}${timestamp}`;

  try {
    const sig = nacl.sign.detached(new TextEncoder().encode(unsigned), dmarketSecretKey(secretHex));
    const url = `https://api.dmarket.com${path}?${query}`;
    const { res, body, latency_ms } = await fetchJson(url, {
      headers: {
        "X-Api-Key": publicKey.toLowerCase(),
        "X-Sign-Date": timestamp,
        "X-Request-Sign": `dmar ed25519 ${bytesToHex(sig)}`,
        Accept: "application/json",
      },
    });
    const items = arrFrom(body);
    return {
      source: "dmarket", ok: res.ok, status: res.status, latency_ms,
      count: items.length,
      next_cursor: body?.cursor != null,
      rate_headers: rateHeaders(res.headers),
      freshness: timestamps(items),
      fields: safeFields(items[0], "dmarket"),
      sample: safeSample(items[0], "dmarket"),
      error: res.ok ? null : (body?.Message ?? body?.message ?? body?.error ?? `HTTP ${res.status}`),
    };
  } catch (e) { return failed("dmarket", e); }
}

function missing(source: string, error: string): ProbeResult {
  return {
    source, ok: false, status: null, latency_ms: 0, count: null, next_cursor: null,
    rate_headers: {}, freshness: { newest_timestamp: null, oldest_timestamp: null },
    fields: { price: false, exact_float: false, paint_seed: false, paint_index: false, inspect: false },
    sample: null, error,
  };
}

function failed(source: string, e: unknown): ProbeResult {
  return missing(source, e instanceof Error ? e.message : String(e));
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/health") {
    return Response.json({
      ok: true,
      service: "scale-radar",
      ops: "OPS-040",
      secrets_present: {
        csdeals: !!envAny("CSDEALS_API_KEY", "CS_DEALS_API_KEY", "CSD_API_KEY"),
        waxpeer: !!envAny("WAXPEER_API_KEY", "WAXPEER_KEY", "WAXPEER_API"),
        dmarket_public: !!envAny("DMARKET_PUBLIC_KEY", "DMARKET_API_PUBLIC_KEY", "DMARKET_KEY"),
        dmarket_secret: !!envAny("DMARKET_SECRET_KEY", "DMARKET_API_SECRET_KEY", "DMARKET_SECRET"),
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (url.pathname === "/probe") {
    const source = url.searchParams.get("source") ?? "all";
    const jobs: Promise<ProbeResult>[] = [];
    if (source === "all" || source === "csdeals") jobs.push(probeCsDeals());
    if (source === "all" || source === "waxpeer") jobs.push(probeWaxpeer());
    if (source === "all" || source === "dmarket") jobs.push(probeDMarket());
    if (!jobs.length) return Response.json({ error: "source must be all|csdeals|waxpeer|dmarket" }, { status: 400 });

    const captured_at = new Date().toISOString();
    const results = await Promise.all(jobs);
    return Response.json({
      ops: "OPS-040",
      captured_at,
      results,
      note: "Sanitized runtime probe. No API keys or signatures are returned.",
    });
  }

  return Response.json({
    service: "scale-radar",
    ops: "OPS-040",
    endpoints: ["/health", "/probe?source=all", "/probe?source=csdeals", "/probe?source=waxpeer", "/probe?source=dmarket"],
  });
});

// OPS-040 rebuild trigger: dynamic runtime configuration applied.
