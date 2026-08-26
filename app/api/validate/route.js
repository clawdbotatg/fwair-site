import { cleanHandle, lookupHandle } from "../../../lib/fwair";

export async function GET(req) {
  const handle = cleanHandle(new URL(req.url).searchParams.get("handle"));
  if (!handle) return Response.json({ ok: false, reason: "that's not a handle" });
  const res = await lookupHandle(handle);
  return Response.json({ handle, ...res });
}
