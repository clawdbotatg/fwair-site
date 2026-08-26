import { cleanHandle, lookupHandle, cachedBlob, underDailyCap, generateFwair } from "../../../lib/fwair";

export const maxDuration = 120; // gen takes ~15-30s

// naive per-instance IP throttle — a cost speed bump, not a fortress
const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "?";
  if (throttled(ip)) return Response.json({ error: "slow down — one box at a time 🦞" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const handle = cleanHandle(body.handle);
  if (!handle) return Response.json({ error: "that's not a valid handle" }, { status: 400 });

  // fresh cache hit = free
  const cached = await cachedBlob(handle);
  if (cached?.fresh) return Response.json({ url: cached.url, handle, cached: true });

  const who = await lookupHandle(handle);
  if (!who.ok) return Response.json({ error: who.reason }, { status: 404 });

  if (!(await underDailyCap()))
    return Response.json({ error: "the fluffer needs to rest — try again tomorrow 🦞" }, { status: 503 });

  try {
    const url = await generateFwair(handle, who.pfp);
    return Response.json({ url, handle });
  } catch (e) {
    const msg = /safety|moderation/i.test(String(e?.message))
      ? "that pfp is too spicy for the fluffer"
      : "the fluffer jammed — try again in a minute";
    return Response.json({ error: msg }, { status: 500 });
  }
}
