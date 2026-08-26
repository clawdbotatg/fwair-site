# fwair.me

Self-serve fwair generator: type a twitter handle, get a plush-in-a-glass-box
render of its pfp. The render is delivered ONLY on the site — sharing is the
user's move, which is the whole viral mechanic.

Next.js + Vercel Blob. One page, three API routes, no database.

## Deploy (Vercel)

1. Import this repo into Vercel.
2. Storage → create a **Blob** store, connect it to the project
   (`BLOB_READ_WRITE_TOKEN` is injected automatically).
3. Environment variables:
   - `OPENAI_API_KEY` — required (gpt-image-2, ~$0.012/render)
   - `X_BEARER_TOKEN` — optional but recommended (handle validation + full-res
     pfps; without it, unavatar.io fallback)
   - `DAILY_CAP` — max renders per UTC day (default 500 ≈ $6)
   - `SITE_URL` — `https://fwair.me`
4. Point the fwair.me domain at the project.

## Seed the gallery

Upload the ~150 renders the twitter bot already made:

```
BLOB_READ_WRITE_TOKEN=... node scripts/seed.mjs \
  ../clawd-twitter/state/fluff/guests
```

## How it works

- `/api/validate?handle=x` — debounced handle check (exists + has a pfp)
- `POST /api/generate {handle}` — 24h per-handle cache → daily cap → pfp →
  sharp 256px → `images.edit` (subject + 1 style ref from `refs/ref.png`) →
  Vercel Blob `f/<handle>.png`
- `/f/<handle>` — the shareable page; `og:image` unfurls the render on X
- `/api/img/<handle>` — stable image URL (og + download) streaming the blob
- `/api/gallery` — 60 most recent renders for the landing grid

Cost controls: per-handle 24h cache, `DAILY_CAP` counter blob, naive per-IP
throttle (5/min). The style prompt is fixed server-side — user input is only
ever a handle, never prompt text.
