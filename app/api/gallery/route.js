import { list } from "@vercel/blob";

export const revalidate = 60;

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "f/", limit: 1000 });
    const items = blobs
      .filter((b) => b.pathname.endsWith(".png"))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 60)
      .map((b) => ({ handle: b.pathname.slice(2, -4), url: b.url }));
    return Response.json({ items });
  } catch {
    return Response.json({ items: [] });
  }
}
