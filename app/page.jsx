"use client";
import { useEffect, useRef, useState } from "react";

const LOAD_MSGS = [
  "warming up the fluffer…",
  "measuring the box…",
  "spinning boucle fleece…",
  "sewing on the bead eyes…",
  "squishing you in…",
  "pressing against the glass…",
  "almost too cute…",
];

export default function Home() {
  const [handle, setHandle] = useState("");
  const [check, setCheck] = useState(null); // {ok, name, reason}
  const [state, setState] = useState("idle"); // idle | loading | done
  const [img, setImg] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [gallery, setGallery] = useState([]);
  const timer = useRef();

  useEffect(() => {
    fetch("/api/gallery").then((r) => r.json()).then((j) => setGallery(j.items || [])).catch(() => {});
  }, []);

  // debounce validate
  useEffect(() => {
    setCheck(null);
    setErr("");
    const h = handle.trim().replace(/^@/, "");
    if (!h) return;
    const t = setTimeout(() => {
      fetch(`/api/validate?handle=${encodeURIComponent(h)}`)
        .then((r) => r.json())
        .then(setCheck)
        .catch(() => {});
    }, 450);
    return () => clearTimeout(t);
  }, [handle]);

  async function go() {
    const h = handle.trim().replace(/^@/, "").toLowerCase();
    if (!h || state === "loading") return;
    setState("loading");
    setErr("");
    setImg(null);
    let i = 0;
    setMsg(LOAD_MSGS[0]);
    timer.current = setInterval(() => setMsg(LOAD_MSGS[++i % LOAD_MSGS.length]), 2400);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: h }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "something jammed");
      setImg({ url: j.url, handle: j.handle });
      setState("done");
    } catch (e) {
      setErr(e.message);
      setState("idle");
    } finally {
      clearInterval(timer.current);
      setMsg("");
    }
  }

  const shareText = img
    ? encodeURIComponent(`i have been fwair'd 🦞\n\nget in the box: https://fwair.me/f/${img.handle}`)
    : "";

  return (
    <main className="wrap">
      <h1>fwair<span className="pink">.me</span></h1>
      <p className="sub">turn any pfp into a plush squished into a glass box</p>

      <div className={`box ${state === "loading" ? "loading" : ""} ${state === "done" ? "poof" : ""}`}>
        {img ? <img src={img.url} alt={`@${img.handle} fwair'd`} /> : <div className="q">?</div>}
      </div>
      <p className="loadmsg">{msg}</p>

      {state !== "done" && (
        <>
          <div className="row">
            <input
              placeholder="@yourhandle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && check?.ok && go()}
              disabled={state === "loading"}
              autoFocus
            />
            <button className="go" onClick={go} disabled={!check?.ok || state === "loading"}>
              {state === "loading" ? "…" : "go"}
            </button>
          </div>
          <p className={`hint ${check ? (check.ok ? "ok" : "bad") : ""}`}>
            {err || (check ? (check.ok ? `found ${check.name} ✓` : check.reason) : " ")}
          </p>
        </>
      )}

      {state === "done" && img && (
        <>
          <div className="actions">
            <a className="primary" href={`https://x.com/intent/post?text=${shareText}`} target="_blank" rel="noreferrer">
              share it 🦞
            </a>
            <a href={`/api/img/${img.handle}`} download={`fwair-${img.handle}.png`}>download</a>
            <a href="https://x.com/settings/profile" target="_blank" rel="noreferrer">set as pfp</a>
          </div>
          <button className="again" onClick={() => { setState("idle"); setImg(null); setHandle(""); }}>
            fluff someone else
          </button>
        </>
      )}

      <p className="gal-title">FRESH OUT OF THE FLUFFER</p>
      <div className="gallery">
        {gallery.map((g) => (
          <a key={g.handle} href={`/f/${g.handle}`} title={`@${g.handle}`}>
            <img src={g.url} alt={`@${g.handle}`} loading="lazy" />
          </a>
        ))}
      </div>

      <p className="foot">
        inspired by the og <a href="https://www.fwa.fun/drops#launches" target="_blank" rel="noreferrer">fwair collection</a>
        {" · "}by <a href="https://x.com/clawdbotatg" target="_blank" rel="noreferrer">@clawdbotatg</a> 🦞
      </p>
    </main>
  );
}
