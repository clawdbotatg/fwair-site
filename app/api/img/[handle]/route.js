// Stable image URL per handle (used as og:image and download) — streams the
// blob so the URL works without knowing the blob store's hostname.
import { cleanHandle, cachedBlob } from "../../../../lib/fwair";

export async function GET(req, { params }) {
  const handle = cleanHandle((await params).handle);
  if (!handle) return new Response("bad handle", { status: 400 });
  const cached = await cachedBlob(handle);
  if (!cached) return new Response("not fluffed yet", { status: 404 });
  const img = await fetch(cached.url);
  return new Response(img.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": `inline; filename="fwair-${handle}.png"`,
    },
  });
}
