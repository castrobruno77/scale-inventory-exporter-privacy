import nacl from "npm:tweetnacl@1.0.3";
import rareCatalogFile from "./ops045_rare_catalog.json" with { type: "json" };

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
  let cursor: string | null = null;
  let totalLatency = 0;
  let totalCount = 0;
  let lastHeaders: Record<string, string> = {};
  let allForFreshness: any[] = [];
  let found: any = null;
  let lastStatus: number | null = null;
  let nextCursor = false;

  try {
    for (let page = 0; page < 3; page++) {
      const u = new URL("https://api.cs.deals/public/v1/listings");
      u.searchParams.set("app_id", "730");
      u.searchParams.set("limit", "500");
      if (cursor) u.searchParams.set("cursor", cursor);

      const { res, body, latency_ms } = await fetchJson(u.toString(), {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      });
      lastStatus = res.status;
      totalLatency += latency_ms;
      lastHeaders = rateHeaders(res.headers);
      const items = arrFrom(body);
      totalCount += items.length;
      allForFreshness = allForFreshness.concat(items);

      found = items.find((it: any) =>
        it?.cs_paint_wear != null &&
        it?.price != null &&
        it?.market_hash_name
      ) ?? found;

      cursor = body?.next_cursor != null ? String(body.next_cursor) : null;
      nextCursor = cursor != null;

      if (!res.ok || found || !cursor) break;
      await new Promise((r) => setTimeout(r, 1100));
    }

    return {
      source: "csdeals", ok: lastStatus === 200, status: lastStatus, latency_ms: totalLatency,
      count: totalCount,
      next_cursor: nextCursor,
      rate_headers: lastHeaders,
      freshness: timestamps(allForFreshness),
      fields: safeFields(found, "csdeals"),
      sample: safeSample(found, "csdeals"),
      error: lastStatus === 200 ? (found ? null : "No float-bearing listing found in first 3 pages") : `HTTP ${lastStatus}`,
    };
  } catch (e) { return failed("csdeals", e); }
}

async function probeWaxpeer(): Promise<ProbeResult> {
  const key = envAny("WAXPEER_API_KEY", "WAXPEER_KEY", "WAXPEER_API");
  if (!key) return missing("waxpeer", "missing API key environment variable");
  const u = new URL("https://api.waxpeer.com/v2/get-items-list");
  u.searchParams.set("game", "csgo");
  u.searchParams.set("limit", "100");
  u.searchParams.set("search", "AK-47 | Redline");
  u.searchParams.set("api", key);
  try {
    const { res, body, latency_ms } = await fetchJson(u.toString(), {
      headers: { Accept: "application/json" },
    });
    const items = arrFrom(body);
    const found = items.find((it: any) => it?.float != null && it?.price != null) ?? items[0] ?? null;
    return {
      source: "waxpeer", ok: res.ok, status: res.status, latency_ms,
      count: items.length,
      next_cursor: (body?.next_cursor ?? body?.cursor) != null,
      rate_headers: rateHeaders(res.headers),
      freshness: timestamps(items),
      fields: safeFields(found, "waxpeer"),
      sample: safeSample(found, "waxpeer"),
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


type RareCatalogRow = { collection: string; skin_name: string; rarity: string; float_min: number; float_max: number };
type RareListing = {
  source: "DMarket";
  offer_id: string;
  collection: string;
  skin: string;
  rarity: string;
  variant: "NORMAL" | "SOUVENIR" | "STATTRAK";
  wear: string | null;
  float: number;
  normalized_float: number;
  price_usd: number;
  captured_at: string;
  native_created_at: string | null;
  listing_link: string | null;
};

const RARE_CATALOG: RareCatalogRow[] = ((rareCatalogFile as any)?.rows ?? []) as RareCatalogRow[];
const TRADEUP_INPUT_RARITIES = new Set(["Consumer Grade","Industrial Grade","Mil-Spec Grade","Restricted","Classified"]);

function median(values: number[]): number | null {
  const xs = values.filter(Number.isFinite).sort((a,b)=>a-b);
  if (!xs.length) return null;
  const m=Math.floor(xs.length/2);
  return xs.length%2 ? xs[m] : (xs[m-1]+xs[m])/2;
}

function percentile(values:number[], p:number): number | null {
  const xs=values.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!xs.length) return null;
  const pos=(xs.length-1)*Math.min(1,Math.max(0,p));
  const lo=Math.floor(pos), hi=Math.ceil(pos);
  if(lo===hi) return xs[lo];
  return xs[lo]+(xs[hi]-xs[lo])*(pos-lo);
}

function wearFromTitle(title: string): string | null {
  const m=title.match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
  return m?.[1] ?? null;
}

function stripVariantAndWear(title: string): { base:string; variant:"NORMAL"|"SOUVENIR"|"STATTRAK" } {
  let x=title.trim();
  let variant:"NORMAL"|"SOUVENIR"|"STATTRAK"="NORMAL";
  if (x.startsWith("Souvenir ")) { variant="SOUVENIR"; x=x.slice("Souvenir ".length); }
  if (/^StatTrak(?:™)?\s+/.test(x)) { variant="STATTRAK"; x=x.replace(/^StatTrak(?:™)?\s+/,""); }
  x=x.replace(/\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/,"");
  return {base:x,variant};
}

async function dmarketOffersByTitle(title: string, limit=100, timeoutMs=25000) {
  const publicKey = envAny("DMARKET_PUBLIC_KEY", "DMARKET_API_PUBLIC_KEY", "DMARKET_KEY");
  const secretHex = envAny("DMARKET_SECRET_KEY", "DMARKET_API_SECRET_KEY", "DMARKET_SECRET");
  if (!publicKey || !secretHex) throw new Error("DMarket credentials unavailable");
  const path="/marketplace-api/v2/offers";
  const params=new URLSearchParams();
  params.set("gameId","a8db");
  params.set("title",title);
  params.set("orderBy","price");
  params.set("orderDir","asc");
  params.set("limit",String(limit));
  params.set("offerType","all");
  const query=params.toString();
  const timestamp=Math.floor(Date.now()/1000).toString();
  const unsigned="GET"+path+"?"+query+timestamp;
  const sig=nacl.sign.detached(new TextEncoder().encode(unsigned),dmarketSecretKey(secretHex));
  const {res,body,latency_ms}=await fetchJson("https://api.dmarket.com"+path+"?"+query,{
    headers:{
      "X-Api-Key":publicKey.toLowerCase(),
      "X-Sign-Date":timestamp,
      "X-Request-Sign":"dmar ed25519 "+bytesToHex(sig),
      Accept:"application/json"
    }
  },timeoutMs);
  return {status:res.status,ok:res.ok,items:arrFrom(body),latency_ms,rate_headers:rateHeaders(res.headers)};
}

async function runRareScan() {
  const startedAt=new Date().toISOString();
  const t0=performance.now();
  const catalog=RARE_CATALOG.filter(r=>TRADEUP_INPUT_RARITIES.has(r.rarity));
  const jobs=catalog.flatMap(row=>[
    {row,query:row.skin_name,kind:"BASE"},
    {row,query:"Souvenir "+row.skin_name,kind:"SOUVENIR"}
  ]);
  const seen=new Set<string>();
  const listings:RareListing[]=[];
  const errors:any[]=[];
  const latencies:number[]=[];
  const statuses:Record<string,number>={};
  let lastRateHeaders:Record<string,string>={};

  const batchSize=8;
  for(let i=0;i<jobs.length;i+=batchSize){
    const batch=jobs.slice(i,i+batchSize);
    const settled=await Promise.all(batch.map(async j=>{
      try { return {j,r:await dmarketOffersByTitle(j.query,j.kind==="SOUVENIR"?30:100)}; }
      catch(e){ return {j,error:e instanceof Error?e.message:String(e)}; }
    }));
    for(const x of settled){
      if("error" in x){ errors.push({skin:x.j.row.skin_name,kind:x.j.kind,error:x.error}); continue; }
      const r=x.r;
      latencies.push(r.latency_ms); lastRateHeaders=r.rate_headers;
      statuses[String(r.status)]=(statuses[String(r.status)]??0)+1;
      if(!r.ok){ errors.push({skin:x.j.row.skin_name,kind:x.j.kind,status:r.status}); continue; }
      for(const item of r.items){
        const title=String(item?.attributes?.title ?? item?.title ?? "");
        const parsed=stripVariantAndWear(title);
        if(parsed.base!==x.j.row.skin_name) continue;
        const cs2=item?.attributes?.cs2 ?? {};
        const fv=Number(cs2?.float);
        const cents=Number(item?.priceCents);
        if(!Number.isFinite(fv)||!Number.isFinite(cents)||cents<=0) continue;
        const span=x.j.row.float_max-x.j.row.float_min;
        if(!(span>0)) continue;
        const nf=(fv-x.j.row.float_min)/span;
        if(!Number.isFinite(nf)||nf<0||nf>1.001) continue;
        const id=String(item?.offerId ?? (title+":"+cents+":"+fv));
        if(seen.has(id)) continue;
        seen.add(id);
        listings.push({
          source:"DMarket",offer_id:id,collection:x.j.row.collection,skin:x.j.row.skin_name,
          rarity:x.j.row.rarity,variant:parsed.variant,wear:wearFromTitle(title),
          float:fv,normalized_float:nf,price_usd:cents/100,
          captured_at:startedAt,native_created_at:item?.createdAt ?? null,
          listing_link:typeof item?.url==="string"?item.url:(typeof item?.link==="string"?item.link:null)
        });
      }
    }
    if(i+batchSize<jobs.length) await new Promise(r=>setTimeout(r,1050));
  }

  const low=listings.filter(x=>x.normalized_float<=0.20);
  const candidates:any[]=[];
  for(const x of low){
    const st=x.variant==="STATTRAK";
    const near=low.filter(p=>p.collection===x.collection && p.rarity===x.rarity &&
      (p.variant==="STATTRAK")===st && p.offer_id!==x.offer_id &&
      Math.abs(p.normalized_float-x.normalized_float)<=0.08);
    const fallback=near.length>=4?near:low.filter(p=>p.collection===x.collection && p.rarity===x.rarity &&
      (p.variant==="STATTRAK")===st && p.offer_id!==x.offer_id);
    const ref=median(fallback.map(p=>p.price_usd));
    if(ref==null||fallback.length<4||ref<=0) continue;
    const gap=(ref-x.price_usd)/ref*100;
    if(gap<15) continue;
    candidates.push({
      collection:x.collection,skin:x.skin,rarity:x.rarity,variant:x.variant,wear:x.wear,
      float:x.float,normalized_float:Number(x.normalized_float.toFixed(6)),
      price_usd:Number(x.price_usd.toFixed(2)),source:x.source,
      comparison:{method:near.length>=4?"MEDIAN_NEARBY_NORMALIZED_FLOAT":"MEDIAN_LOW_FLOAT_GROUP",reference_usd:Number(ref.toFixed(2)),peer_count:fallback.length},
      gap_pct:Number(gap.toFixed(2)),captured_at:x.captured_at,
      native_created_at:x.native_created_at,
      reason:"low normalized float ("+(x.normalized_float*100).toFixed(1)+"% of item range) + "+gap.toFixed(1)+"% below comparable "+(st?"StatTrak":"Normal/Souvenir")+" peers"
    });
  }
  candidates.sort((a,b)=>b.gap_pct-a.gap_pct || a.normalized_float-b.normalized_float || a.price_usd-b.price_usd);

  const souvenirCount=listings.filter(x=>x.variant==="SOUVENIR").length;
  const normalCount=listings.filter(x=>x.variant==="NORMAL").length;
  const stattrak=listings.filter(x=>x.variant==="STATTRAK");
  const stattrakCollections=[...new Set(stattrak.map(x=>x.collection))].sort();

  const finishedAt=new Date().toISOString();
  const durationMs=Math.round(performance.now()-t0);
  latencies.sort((a,b)=>a-b);
  const p95=latencies.length?latencies[Math.min(latencies.length-1,Math.floor(latencies.length*0.95))]:null;

  return {
    ops:"OPS-045",mode:"RARE_COLLECTION_RADAR_V0",started_at:startedAt,finished_at:finishedAt,duration_ms:durationMs,
    allowlist_collections:[...new Set(catalog.map(x=>x.collection))].sort(),
    catalog_tradeup_input_skins:catalog.length,
    calls:{attempted:jobs.length,statuses,errors:errors.slice(0,20),error_count:errors.length,latency_avg_ms:latencies.length?Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length):null,latency_p95_ms:p95,rate_headers:lastRateHeaders},
    listings:{evaluated:listings.length,normal:normalCount,souvenir:souvenirCount,stattrak:stattrak.length,low_float_20pct:low.length},
    stattrak_validation:{observed_listing_count:stattrak.length,collections:stattrakCollections,note:stattrak.length?"Observed in fresh DMarket results; kept separate from Normal/Souvenir.":"No StatTrak listing observed in fresh DMarket title scans; this is observational, not a catalog impossibility claim."},
    thresholds:{normalized_float_max:0.20,gap_pct_min:15,provisional:true},
    opportunities:candidates.slice(0,30),
    opportunity_count:candidates.length,
    buy_order_comparison:"N/D — not supported by this controlled DMarket scan",
    freshness:{source:"DMarket",captured_at:startedAt,age_at_completion_seconds:Math.round((Date.parse(finishedAt)-Date.parse(startedAt))/1000),meaning:"SCALE capture time for current marketplace API responses; native listing createdAt is preserved separately."},
    caveats:[
      "Normal and Souvenir are pooled for non-StatTrak peer comparison; Souvenir remains provenance metadata only.",
      "StatTrak is separated when observed.",
      "Local peer median is scan-specific comparison evidence, not a global reference_price.",
      "No stale Supabase market snapshots are used to create actionable opportunities."
    ]
  };
}

async function runRareScanBounded(params:{source:string;collection:string;rarity:string;max_jobs:number;concurrency:number;timeout_ms:number;deadline_ms:number}) {
  const startedAt=new Date().toISOString();
  const t0=performance.now();
  const deadlineAt=Date.now()+params.deadline_ms;
  const catalog=RARE_CATALOG.filter(r=>r.collection===params.collection && r.rarity===params.rarity && TRADEUP_INPUT_RARITIES.has(r.rarity));
  const jobs=catalog.flatMap(row=>[
    {row,query:row.skin_name,kind:"BASE"},
    {row,query:"Souvenir "+row.skin_name,kind:"SOUVENIR"}
  ]).slice(0,params.max_jobs);
  const seen=new Set<string>();
  const listings:RareListing[]=[];
  const errors:any[]=[];
  const progress:any[]=[];
  const rateHeaders:any[]=[];
  let completed=0;

  const emit=(evt:any)=>{
    const e={ts:new Date().toISOString(),...evt};
    progress.push(e);
    console.log(JSON.stringify({ops:"OPS-045",mode:"MINI_SCAN_PROGRESS",...e}));
  };

  emit({event:"start",source:params.source,collection:params.collection,rarity:params.rarity,jobs_planned:jobs.length});

  for(let i=0;i<jobs.length;i+=params.concurrency){
    if(Date.now()>=deadlineAt){
      emit({event:"deadline",batch_start:i,remaining:jobs.length-i});
      break;
    }
    const batch=jobs.slice(i,i+params.concurrency);
    const settled=await Promise.all(batch.map(async (j,offset)=>{
      const remaining=Math.max(1000,deadlineAt-Date.now());
      const timeout=Math.min(params.timeout_ms,remaining);
      const jobIndex=i+offset;
      emit({event:"job_start",job_index:jobIndex,skin:j.row.skin_name,kind:j.kind,timeout_ms:timeout});
      try {
        const r=await dmarketOffersByTitle(j.query,j.kind==="SOUVENIR"?30:100,timeout);
        return {j,r,jobIndex};
      } catch(e){
        return {j,error:e instanceof Error?e.message:String(e),jobIndex};
      }
    }));
    for(const x of settled){
      if("error" in x){
        errors.push({job_index:x.jobIndex,skin:x.j.row.skin_name,kind:x.j.kind,error:x.error});
        emit({event:"job_error",job_index:x.jobIndex,skin:x.j.row.skin_name,kind:x.j.kind,error:x.error});
        completed++;
        continue;
      }
      const r=x.r;
      rateHeaders.push({job_index:x.jobIndex,...r.rate_headers});
      let accepted=0;
      for(const item of r.items){
        const title=String(item?.attributes?.title ?? item?.title ?? "");
        const parsed=stripVariantAndWear(title);
        if(parsed.base!==x.j.row.skin_name) continue;
        const cs2=item?.attributes?.cs2 ?? {};
        const fv=Number(cs2?.float);
        const cents=Number(item?.priceCents);
        if(!Number.isFinite(fv)||!Number.isFinite(cents)||cents<=0) continue;
        const span=x.j.row.float_max-x.j.row.float_min;
        if(!(span>0)) continue;
        const nf=(fv-x.j.row.float_min)/span;
        if(!Number.isFinite(nf)||nf<0||nf>1.001) continue;
        const id=String(item?.offerId ?? (title+":"+cents+":"+fv));
        if(seen.has(id)) continue;
        seen.add(id);
        listings.push({
          source:"DMarket",offer_id:id,collection:x.j.row.collection,skin:x.j.row.skin_name,
          rarity:x.j.row.rarity,variant:parsed.variant,wear:wearFromTitle(title),
          float:fv,normalized_float:nf,price_usd:cents/100,
          captured_at:new Date().toISOString(),native_created_at:item?.createdAt ?? null,
          listing_link:typeof item?.url==="string"?item.url:(typeof item?.link==="string"?item.link:null)
        });
        accepted++;
      }
      if(!r.ok) errors.push({job_index:x.jobIndex,skin:x.j.row.skin_name,kind:x.j.kind,status:r.status});
      completed++;
      emit({event:r.ok?"job_done":"job_error",job_index:x.jobIndex,skin:x.j.row.skin_name,kind:x.j.kind,status:r.status,raw_items:r.items.length,accepted_listings:accepted,latency_ms:r.latency_ms,rate_headers:r.rate_headers});
    }
    emit({event:"batch_done",batch_start:i,batch_size:batch.length,jobs_completed:completed,jobs_error:errors.length,listings_received:listings.length});
  }

  const low=listings.filter(x=>x.normalized_float<=0.20 && x.variant!=="STATTRAK");
  const candidates:any[]=[];
  for(const x of low){
    const near=low.filter(p=>p.offer_id!==x.offer_id &&
      Math.abs(p.normalized_float-x.normalized_float)<=0.08);
    const fallback=near.length>=4?near:low.filter(p=>p.offer_id!==x.offer_id);
    const ref=median(fallback.map(p=>p.price_usd));
    if(ref==null||fallback.length<4||ref<=0) continue;
    const localGap=(ref-x.price_usd)/ref*100;
    if(localGap<15) continue;

    const equalOrBetter=listings.filter(p=>
      p.variant!=="STATTRAK" &&
      p.collection===x.collection &&
      p.rarity===x.rarity &&
      p.offer_id!==x.offer_id &&
      p.normalized_float<=x.normalized_float+1e-9
    );
    const prices=equalOrBetter.map(p=>p.price_usd).filter(Number.isFinite).sort((a,b)=>a-b);
    const cheapest=equalOrBetter.slice().sort((a,b)=>a.price_usd-b.price_usd || a.normalized_float-b.normalized_float)[0] ?? null;
    const robustGap=cheapest&&cheapest.price_usd>0 ? (cheapest.price_usd-x.price_usd)/cheapest.price_usd*100 : null;
    const classification =
      equalOrBetter.length<4 || !cheapest ? "INSUFFICIENT_EVIDENCE" :
      robustGap!==null && robustGap>=15 ? "CERTIFIED_SURVIVOR" :
      "REJECTED_BY_COMPARATOR";

    candidates.push({
      classification,
      skin:x.skin,variant:x.variant,wear:x.wear,
      float:x.float,normalized_float:Number(x.normalized_float.toFixed(6)),
      price_usd:Number(x.price_usd.toFixed(2)),
      offer_id:x.offer_id,
      listing_link:x.listing_link,
      local_reference:{
        method:near.length>=4?"MEDIAN_NEARBY_NORMALIZED_FLOAT":"MEDIAN_LOW_FLOAT_GROUP",
        price_usd:Number(ref.toFixed(2)),
        peer_count:fallback.length,
        gap_pct:Number(localGap.toFixed(2))
      },
      robust_comparator:{
        rule:"CHEAPEST_EQUAL_OR_BETTER_NORMALIZED_FLOAT",
        peer_count:equalOrBetter.length,
        cheapest_price_usd:cheapest?Number(cheapest.price_usd.toFixed(2)):null,
        cheapest_offer_id:cheapest?.offer_id ?? null,
        cheapest_listing_link:cheapest?.listing_link ?? null,
        cheapest_float:cheapest?.float ?? null,
        cheapest_normalized_float:cheapest?Number(cheapest.normalized_float.toFixed(6)):null,
        gap_pct:robustGap===null?null:Number(robustGap.toFixed(2)),
        price_percentiles_usd:{
          p25:percentile(prices,0.25)===null?null:Number(percentile(prices,0.25)!.toFixed(2)),
          p50:percentile(prices,0.50)===null?null:Number(percentile(prices,0.50)!.toFixed(2)),
          p75:percentile(prices,0.75)===null?null:Number(percentile(prices,0.75)!.toFixed(2))
        }
      },
      timestamp:x.captured_at
    });
  }
  candidates.sort((a,b)=>{
    const rank=(v:string)=>v==="CERTIFIED_SURVIVOR"?0:v==="INSUFFICIENT_EVIDENCE"?1:2;
    return rank(a.classification)-rank(b.classification) ||
      (b.robust_comparator?.gap_pct??-999)-(a.robust_comparator?.gap_pct??-999) ||
      a.normalized_float-b.normalized_float ||
      a.price_usd-b.price_usd;
  });

  const certified=candidates.filter(x=>x.classification==="CERTIFIED_SURVIVOR");
  const rejected=candidates.filter(x=>x.classification==="REJECTED_BY_COMPARATOR");
  const insufficient=candidates.filter(x=>x.classification==="INSUFFICIENT_EVIDENCE");
  const finishedAt=new Date().toISOString();
  const durationMs=Math.round(performance.now()-t0);
  emit({event:"finish",jobs_planned:jobs.length,jobs_completed:completed,jobs_error:errors.length,listings_received:listings.length,candidates:candidates.length,certified_survivors:certified.length,rejected_by_comparator:rejected.length,insufficient_evidence:insufficient.length,duration_ms:durationMs});

  return {
    ops:"OPS-045",mode:"MINI_SCAN_ROBUST_COMPARATOR",status:completed===jobs.length?"PASS":"PARTIAL",
    params,jobs:{planned:jobs.length,completed,error:errors.length},
    listings_received:listings.length,
    freshness:{captured_at:finishedAt,age_at_completion_seconds:0,meaning:"SCALE response completion time; each listing also carries its own captured_at/native_created_at."},
    duration_ms:durationMs,
    rate_limit_observed:rateHeaders,
    opportunities:candidates,
    robust_validation:{
      original_signal_count:candidates.length,
      certified_survivors:certified.length,
      rejected_by_comparator:rejected.length,
      insufficient_evidence:insufficient.length,
      top_10_survivors:certified.slice(0,10),
      result:completed!==jobs.length?"PARTIAL":(insufficient.length>0?"PARTIAL":"PASS")
    },
    errors,
    progress,
    caveats:[
      "Normal and Souvenir are pooled as equivalent trade-up inputs; provenance remains in variant.",
      "StatTrak, if returned incidentally, is never pooled with Normal/Souvenir.",
      "Reference is local to this bounded scan and is not a global reference_price.",
      "Robust comparator uses all accepted non-StatTrak Normal+Souvenir listings with normalized float equal to or better than each candidate.",
      "CERTIFIED_SURVIVOR requires at least 4 equal-or-better peers and candidate price at least 15% below the cheapest such peer."
    ]
  };
}

function waxpeerUsd(raw:any):number|null{
  const n=Number(raw); if(!Number.isFinite(n)||n<=0) return null;
  return n>10000?n/100000:n;
}

async function crosscheckWaxpeer(names:string[]){
  const key=envAny("WAXPEER_API_KEY","WAXPEER_KEY","WAXPEER_API");
  if(!key) throw new Error("Waxpeer credential unavailable");
  const out:any[]=[];
  for(let i=0;i<names.length;i++){
    const name=names[i];
    const u=new URL("https://api.waxpeer.com/v2/get-items-list");
    u.searchParams.set("game","csgo");u.searchParams.set("limit","100");u.searchParams.set("search",name);u.searchParams.set("api",key);
    const {res,body,latency_ms}=await fetchJson(u.toString(),{headers:{Accept:"application/json"}},25000);
    const items=arrFrom(body).filter((it:any)=>{
      const title=String(it?.name ?? it?.market_hash_name ?? "");
      return stripVariantAndWear(title).base===name;
    });
    const sample=items.filter((it:any)=>Number.isFinite(Number(it?.float))&&waxpeerUsd(it?.price)!=null)
      .map((it:any)=>({name:String(it?.name??it?.market_hash_name??""),variant:stripVariantAndWear(String(it?.name??it?.market_hash_name??"")).variant,float:Number(it.float),price_usd:waxpeerUsd(it.price)}))
      .sort((a:any,b:any)=>Number(a.price_usd)-Number(b.price_usd)).slice(0,10);
    out.push({skin:name,status:res.status,ok:res.ok,latency_ms,count:items.length,sample});
    if(i<names.length-1) await new Promise(r=>setTimeout(r,3100));
  }
  return {source:"Waxpeer",captured_at:new Date().toISOString(),results:out};
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/rare-scan") {
    const source=url.searchParams.get("source")??"DMarket";
    const collection=url.searchParams.get("collection")??"";
    const rarity=url.searchParams.get("rarity")??"";
    const maxJobs=Math.min(10,Math.max(1,Number(url.searchParams.get("max_jobs")??"10")));
    const concurrency=Math.min(2,Math.max(1,Number(url.searchParams.get("concurrency")??"2")));
    const timeoutMs=Math.min(15000,Math.max(10000,Number(url.searchParams.get("timeout_ms")??"12000")));
    const deadlineMs=Math.min(90000,Math.max(10000,Number(url.searchParams.get("deadline_ms")??"85000")));
    if(source!=="DMarket") return Response.json({ops:"OPS-045",error:"source must be DMarket for this bounded test"},{status:400});
    if(collection!=="The 2021 Mirage Collection"||rarity!=="Consumer Grade") return Response.json({ops:"OPS-045",error:"bounded OPS-045 authorization allows only The 2021 Mirage Collection × Consumer Grade"},{status:400});
    try { return Response.json(await runRareScanBounded({source,collection,rarity,max_jobs:maxJobs,concurrency,timeout_ms:timeoutMs,deadline_ms:deadlineMs})); }
    catch (e) { return Response.json({ops:"OPS-045",mode:"MINI_SCAN",status:"ERROR",error:e instanceof Error?e.message:String(e)}, {status:500}); }
  }

  if (url.pathname === "/rare-crosscheck") {
    const names=(url.searchParams.get("names")??"").split(";;").map(s=>s.trim()).filter(Boolean).slice(0,10);
    if(!names.length) return Response.json({error:"names required, separated by ;;, max 10"},{status:400});
    try { return Response.json({ops:"OPS-045",...(await crosscheckWaxpeer(names))}); }
    catch(e){ return Response.json({ops:"OPS-045",error:e instanceof Error?e.message:String(e)},{status:500}); }
  }

  if (url.pathname === "/health") {
    return Response.json({
      ok: true,
      service: "scale-radar",
      ops: "OPS-045",
      revision: "OPS045_ROBUST_COMPARATOR_V1",
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
      ops: "OPS-045",
      captured_at,
      results,
      note: "Sanitized runtime probe. No API keys or signatures are returned.",
    });
  }

  return Response.json({
    service: "scale-radar",
    ops: "OPS-045",
    endpoints: ["/health","/rare-scan","/rare-crosscheck?names=SKIN1;;SKIN2","/probe?source=all","/probe?source=csdeals","/probe?source=waxpeer","/probe?source=dmarket"],
  });
});

// OPS-040 rebuild trigger: dynamic runtime configuration applied.
