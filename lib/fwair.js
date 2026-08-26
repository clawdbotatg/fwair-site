// Core: handle → pfp → fwair render → Vercel Blob. Prompt + settings ported
// from fwair-me/fwairify.mjs (quality low + 1 ref + 256px ≈ $0.012/render).
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { list, put } from "@vercel/blob";
import { readFile } from "fs/promises";
import path from "path";

export const PROMPT = `Turn the subject of the FIRST image (person, character, or logo) into a plush from the fwair collection, matching the rendering style of the other input image(s) exactly: a chunky chibi stuffed toy sewn entirely from fuzzy boucle fleece, comically overstuffed into a clear glass display cube it barely fits - oversized head pressed against the top pane, stubby arms and shoulders squashed flat against the side walls with visible bulging, two big rounded feet at the bottom front, fabric touching all four inner walls. Every detail (hair, brows, facial hair, glasses, hats, clothing, jewelry, tattoos, logos) is soft fabric, felt applique, or embroidery - nothing drawn or printed. The only shiny material: glossy black plastic bead eyes with two white highlights. Keep the subject clearly recognizable - hair style and color, skin tone, accessories, outfit colors - translated into fabric; simplify the face to the chibi idiom. An abstract logo becomes that shape itself sewn in fleece with bead eyes. Never copy identity or colors from the style reference. Square frontal product photo, thin glass frame visible on all four edges, soft even studio light, dark neutral background. No text, no watermark.`;

export const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
const CACHE_HOURS = 24;

export function cleanHandle(raw) {
  const h = String(raw || "").trim().replace(/^@/, "");
  return HANDLE_RE.test(h) ? h.toLowerCase() : null;
}

// handle → {ok, name, pfp} — X API when bearer is set, unavatar fallback
export async function lookupHandle(handle) {
  const bearer = process.env.X_BEARER_TOKEN;
  if (bearer) {
    try {
      const r = await fetch(
        `https://api.x.com/2/users/by/username/${handle}?user.fields=profile_image_url,name`,
        { headers: { Authorization: `Bearer ${bearer}` }, next: { revalidate: 0 } }
      );
      if (r.ok) {
        const j = await r.json();
        const raw = j?.data?.profile_image_url;
        if (!raw) return { ok: false, reason: "no such account" };
        if (raw.includes("default_profile")) return { ok: false, reason: "that account has no pfp" };
        return { ok: true, name: j.data.name, pfp: raw.replace("_normal", "_400x400") };
      }
      if (r.status === 404) return { ok: false, reason: "no such account" };
    } catch {}
  }
  const r = await fetch(`https://unavatar.io/x/${handle}?fallback=false`, { method: "HEAD" });
  if (!r.ok) return { ok: false, reason: "couldn't find that account" };
  return { ok: true, name: handle, pfp: `https://unavatar.io/x/${handle}?fallback=false` };
}

export async function cachedBlob(handle) {
  const { blobs } = await list({ prefix: `f/${handle}.png`, limit: 1 });
  const b = blobs.find((x) => x.pathname === `f/${handle}.png`);
  if (!b) return null;
  const ageH = (Date.now() - new Date(b.uploadedAt).getTime()) / 3600000;
  return { url: b.url, fresh: ageH < CACHE_HOURS };
}

// daily budget: one counter blob per UTC day, read-modify-write (races are
// tolerable — the cap is a cost backstop, not an exact meter)
export async function underDailyCap() {
  const cap = parseInt(process.env.DAILY_CAP || "500", 10);
  const key = `meta/count-${new Date().toISOString().slice(0, 10)}.json`;
  let n = 0;
  try {
    const { blobs } = await list({ prefix: key, limit: 1 });
    if (blobs[0]) n = (await (await fetch(blobs[0].url)).json()).n || 0;
  } catch {}
  if (n >= cap) return false;
  await put(key, JSON.stringify({ n: n + 1 }), {
    access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
  });
  return true;
}

export async function generateFwair(handle, pfpUrl) {
  const pfpRes = await fetch(pfpUrl);
  if (!pfpRes.ok) throw new Error("couldn't fetch that pfp");
  const subject = await sharp(Buffer.from(await pfpRes.arrayBuffer()))
    .resize(256, 256, { fit: "cover" }).png().toBuffer();
  const ref = await readFile(path.join(process.cwd(), "refs", "ref.png"));

  const client = new OpenAI();
  const result = await client.images.edit({
    model: "gpt-image-2",
    image: [
      await toFile(subject, "subject.png", { type: "image/png" }),
      await toFile(ref, "ref.png", { type: "image/png" }),
    ],
    prompt: PROMPT,
    size: "1024x1024",
    quality: "low",
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image came back");
  const png = Buffer.from(b64, "base64");
  const blob = await put(`f/${handle}.png`, png, {
    access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "image/png",
  });
  return blob.url;
}
