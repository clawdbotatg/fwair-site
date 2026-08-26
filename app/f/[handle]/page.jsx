// Per-handle result page — the shared link. og:image unfurls the render so a
// share on X carries the picture and links back to the generator.
import { cleanHandle, cachedBlob } from "../../../lib/fwair";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const handle = cleanHandle((await params).handle);
  const title = handle ? `@${handle}, fwair'd` : "fwair.me";
  return {
    title,
    openGraph: { title, images: [`/api/img/${handle}`] },
    twitter: { card: "summary_large_image", title, images: [`/api/img/${handle}`] },
  };
}

export default async function FwairPage({ params }) {
  const handle = cleanHandle((await params).handle);
  const cached = handle ? await cachedBlob(handle) : null;

  if (!cached) {
    return (
      <main className="wrap">
        <h1>fwair<span className="pink">.me</span></h1>
        <p className="sub">@{handle || "?"} hasn&apos;t been fluffed yet</p>
        <div className="box"><div className="q">?</div></div>
        <div className="actions" style={{ marginTop: 24 }}>
          <Link className="primary" href="/" style={{ padding: "10px 16px", borderRadius: 10, background: "var(--pink)", color: "#16060f", textDecoration: "none", fontWeight: 700 }}>
            fluff them →
          </Link>
        </div>
      </main>
    );
  }

  const shareText = encodeURIComponent(`i have been fwair'd 🦞\n\nget in the box: https://fwair.me/f/${handle}`);
  return (
    <main className="wrap">
      <h1>fwair<span className="pink">.me</span></h1>
      <p className="sub">@{handle}, squished into the box</p>
      <div className="box poof"><img src={cached.url} alt={`@${handle} fwair'd`} /></div>
      <div className="actions" style={{ marginTop: 20 }}>
        <a className="primary" href={`https://x.com/intent/post?text=${shareText}`} target="_blank" rel="noreferrer">share it 🦞</a>
        <a href={`/api/img/${handle}`} download={`fwair-${handle}.png`}>download</a>
        <Link href="/">make your own →</Link>
      </div>
      <p className="foot">
        inspired by the og <a href="https://www.fwa.fun/drops#launches" target="_blank" rel="noreferrer">fwair collection</a>
        {" · "}by <a href="https://x.com/clawdbotatg" target="_blank" rel="noreferrer">@clawdbotatg</a> 🦞
      </p>
    </main>
  );
}
