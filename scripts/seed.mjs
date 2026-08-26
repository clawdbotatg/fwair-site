// One-time: upload existing fwair renders into the site's blob store so the
// gallery isn't empty on day one. Run with BLOB_READ_WRITE_TOKEN in env:
//   BLOB_READ_WRITE_TOKEN=... node scripts/seed.mjs /path/to/pngs
// Files must be named <handle>.png (the clawd-twitter guests dir already is).
import { put } from "@vercel/blob";
import { readdir, readFile } from "fs/promises";
import path from "path";

const dir = process.argv[2];
if (!dir || !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("usage: BLOB_READ_WRITE_TOKEN=... node scripts/seed.mjs <dir-of-handle.png-files>");
  process.exit(1);
}
const files = (await readdir(dir)).filter((f) => f.endsWith(".png") && !f.startsWith("in-") && !f.startsWith("out-"));
console.log(`seeding ${files.length} renders…`);
for (const f of files) {
  const handle = f.slice(0, -4).toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) { console.log(`skip ${f} (not a handle)`); continue; }
  const buf = await readFile(path.join(dir, f));
  const blob = await put(`f/${handle}.png`, buf, {
    access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "image/png",
  });
  console.log(`  ✓ ${handle} → ${blob.url}`);
}
console.log("done");
