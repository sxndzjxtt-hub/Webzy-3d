import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLANS = {
  Basic: { price: 99, sites: 3, watermark: true, label: "Basic", color: "#a78bfa" },
  Pro: { price: 199, sites: 20, watermark: false, label: "Pro", color: "#818cf8" },
  Premium: { price: 499, sites: Infinity, watermark: false, label: "Premium", color: "#38bdf8" },
};

const RAZORPAY = {
  Basic: "https://rzp.io/l/webzy-basic",
  Pro: "https://rzp.io/l/webzy-pro",
  Premium: "https://rzp.io/l/webzy-premium",
};

const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem(k),
};

// ─── STYLES (injected once) ────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg0: #040408;
      --bg1: #0a0a12;
      --bg2: #0f0f1a;
      --bg3: #141428;
      --surface: rgba(255,255,255,0.04);
      --surface2: rgba(255,255,255,0.07);
      --border: rgba(255,255,255,0.08);
      --border2: rgba(255,255,255,0.15);
      --purple: #7c3aed;
      --violet: #8b5cf6;
      --indigo: #6366f1;
      --blue: #3b82f6;
      --cyan: #06b6d4;
      --text1: #f0f0ff;
      --text2: #a0a0c0;
      --text3: #60607a;
      --glow-p: rgba(124,58,237,0.35);
      --glow-b: rgba(59,130,246,0.25);
      --grad1: linear-gradient(135deg, #7c3aed, #3b82f6);
      --grad2: linear-gradient(135deg, #6366f1, #06b6d4);
      --font-display: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
    }

    html { scroll-behavior: smooth; }
    body { background: var(--bg0); color: var(--text1); font-family: var(--font-body); overflow-x: hidden; }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg1); }
    ::-webkit-scrollbar-thumb { background: var(--purple); border-radius: 3px; }

    .glass {
      background: var(--surface);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
    }
    .glass2 {
      background: var(--surface2);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border2);
    }
    .glow-btn {
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .glow-btn:hover { transform: translateY(-2px); box-shadow: 0 0 40px var(--glow-p); }
    .glow-btn:active { transform: scale(0.97); }
    .glow-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .glow-btn:hover::before { opacity: 1; }

    .fade-in { animation: fadeIn 0.5s ease forwards; }
    .slide-up { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes orbit {
      from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
      to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
    }
    @keyframes shimmer {
      from { background-position: -200% 0; }
      to { background-position: 200% 0; }
    }

    input, textarea {
      background: var(--surface);
      border: 1px solid var(--border2);
      color: var(--text1);
      font-family: var(--font-body);
      border-radius: 10px;
      padding: 12px 16px;
      width: 100%;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus, textarea:focus {
      border-color: var(--violet);
      box-shadow: 0 0 0 3px rgba(139,92,246,0.2);
    }
    input::placeholder, textarea::placeholder { color: var(--text3); }

    a { color: var(--violet); text-decoration: none; }
    a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .hide-mobile { display: none !important; }
    }
  `}</style>
);

// ─── NOISE / ORB BACKGROUND ───────────────────────────────────────────────────
const BgOrbs = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    <div style={{
      position: "absolute", width: 600, height: 600,
      top: "-10%", left: "-10%",
      background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
      animation: "float 8s ease-in-out infinite",
    }} />
    <div style={{
      position: "absolute", width: 500, height: 500,
      top: "40%", right: "-8%",
      background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)",
      animation: "float 10s ease-in-out infinite 2s",
    }} />
    <div style={{
      position: "absolute", width: 400, height: 400,
      bottom: "10%", left: "30%",
      background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
      animation: "float 7s ease-in-out infinite 1s",
    }} />
  </div>
);

// ─── NAV ──────────────────────────────────────────────────────────────────────
const Nav = ({ user, page, setPage, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      transition: "background 0.3s, border-color 0.3s",
      background: scrolled ? "rgba(4,4,8,0.85)" : "transparent",
      backdropFilter: scrolled ? "blur(24px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "var(--grad1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "var(--font-display)",
            boxShadow: "0 0 20px var(--glow-p)",
          }}>W</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--text1)", letterSpacing: "-0.5px" }}>
            Webzy <span style={{ background: "var(--grad1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>3D</span>
          </span>
        </button>

        {/* Desktop links */}
        <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["home", "pricing"].map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: page === p ? "var(--text1)" : "var(--text2)",
              fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
              padding: "6px 14px", borderRadius: 8,
              transition: "color 0.2s, background 0.2s",
              textTransform: "capitalize",
              background: page === p ? "var(--surface2)" : "transparent",
            }}>{p}</button>
          ))}
          {user && (
            <button onClick={() => setPage("dashboard")} style={{
              background: page === "dashboard" ? "var(--surface2)" : "none",
              border: "none", cursor: "pointer",
              color: page === "dashboard" ? "var(--text1)" : "var(--text2)",
              fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500,
              padding: "6px 14px", borderRadius: 8, transition: "color 0.2s, background 0.2s",
            }}>Dashboard</button>
          )}
        </div>

        {/* Auth buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <span className="hide-mobile" style={{ fontSize: 13, color: "var(--text2)" }}>{user.email}</span>
              <button onClick={onLogout} className="glow-btn" style={{
                background: "var(--surface2)", border: "1px solid var(--border2)",
                color: "var(--text1)", padding: "8px 16px", borderRadius: 8,
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => setPage("login")} style={{
                background: "none", border: "none", color: "var(--text2)",
                fontFamily: "var(--font-body)", fontSize: 14, cursor: "pointer", padding: "8px 12px",
              }}>Log in</button>
              <button onClick={() => setPage("signup")} className="glow-btn" style={{
                background: "var(--grad1)", border: "none", color: "#fff",
                padding: "8px 18px", borderRadius: 8, fontFamily: "var(--font-body)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Get started</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// ─── 3D ORBIT ANIMATION ───────────────────────────────────────────────────────
const OrbitRing = () => (
  <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
    <div style={{
      position: "absolute", inset: "20%",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)",
      animation: "pulse 3s ease-in-out infinite",
      boxShadow: "0 0 80px rgba(124,58,237,0.4)",
    }} />
    {/* Ring */}
    <div style={{
      position: "absolute", inset: "10%",
      borderRadius: "50%",
      border: "1px solid rgba(139,92,246,0.3)",
      transform: "rotateX(75deg)",
    }} />
    <div style={{
      position: "absolute", inset: "20%",
      borderRadius: "50%",
      border: "1px solid rgba(59,130,246,0.25)",
      transform: "rotateX(75deg) rotateZ(45deg)",
    }} />
    {/* Orbiting dots */}
    {[0, 120, 240].map((deg, i) => (
      <div key={i} style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: `spin ${4 + i * 1.5}s linear infinite`,
      }}>
        <div style={{
          transform: `rotate(${deg}deg) translateX(${80 + i * 20}px)`,
          width: 10 - i * 2,
          height: 10 - i * 2,
          borderRadius: "50%",
          background: ["var(--violet)", "var(--blue)", "var(--cyan)"][i],
          boxShadow: `0 0 12px ${["var(--violet)", "var(--blue)", "var(--cyan)"][i]}`,
        }} />
      </div>
    ))}
    {/* Center W */}
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: "var(--grad1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, color: "#fff",
        boxShadow: "0 0 50px rgba(124,58,237,0.6), 0 0 100px rgba(124,58,237,0.3)",
        animation: "float 4s ease-in-out infinite",
      }}>W</div>
    </div>
  </div>
);

// ─── HERO ─────────────────────────────────────────────────────────────────────
const Hero = ({ user, setPage }) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(t);
  }, [loading]);

  const generate = async () => {
    if (!prompt.trim()) return;
    if (!user) { setPage("signup"); return; }
    setLoading(true);
    setGenerated(null);
    try {
      const res = await fetch("https://webzy-3d-backend-production.up.railway.app/generate", { {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a website code generator. Generate ONLY a complete, beautiful, modern HTML page with embedded CSS and JS based on the user's prompt. Return ONLY raw HTML code starting with <!DOCTYPE html>. Make it visually stunning with dark theme, gradients, and animations. No explanation, no markdown, just HTML.`,
          messages: [{ role: "user", content: `Create a website: ${prompt}` }],
        }),
      });
      const data = await res.json();
      const html = data.content?.find(b => b.type === "text")?.text || "";
      setGenerated(html);
      // Save to history
      const hist = LS.get("webzy_history") || [];
      hist.unshift({ id: Date.now(), prompt, html, createdAt: new Date().toISOString() });
      LS.set("webzy_history", hist.slice(0, 20));
    } catch (e) {
      setGenerated(`<html><body style="background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h2>⚡ Preview ready — backend not connected yet. Your prompt: "${prompt}"</h2></body></html>`);
    }
    setLoading(false);
  };

  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", position: "relative" }}>
      {/* Badge */}
      <div className="slide-up glass" style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "6px 16px", borderRadius: 100, marginBottom: 32,
        animationDelay: "0.1s",
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 8px #22d3ee", animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>AI-Powered Website Builder</span>
      </div>

      {/* Headline */}
      <h1 className="slide-up" style={{
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(42px, 7vw, 84px)",
        lineHeight: 1.05, letterSpacing: "-2px", textAlign: "center", maxWidth: 800,
        animationDelay: "0.15s",
      }}>
        Build Stunning{" "}
        <span style={{ background: "var(--grad1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>3D Websites</span>
        {" "}with AI 🚀
      </h1>

      <p className="slide-up" style={{
        marginTop: 20, fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text2)",
        textAlign: "center", maxWidth: 520, lineHeight: 1.6, animationDelay: "0.2s",
      }}>
        Just type… and your website comes alive. No code, no designers, no limits.
      </p>

      {/* Prompt Input */}
      <div className="slide-up" style={{ width: "100%", maxWidth: 680, marginTop: 48, animationDelay: "0.25s" }}>
        <div className="glass" style={{ borderRadius: 16, padding: 8, display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
            placeholder="Describe your website... e.g. 'A luxury watch brand landing page with 3D animations'"
            rows={3}
            style={{ flex: 1, resize: "none", background: "transparent", border: "none", borderRadius: 10, fontSize: 15, lineHeight: 1.5 }}
          />
          <button onClick={generate} disabled={loading} className="glow-btn" style={{
            background: loading ? "rgba(124,58,237,0.3)" : "var(--grad1)",
            border: "none", borderRadius: 10, padding: "12px 24px",
            color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", minWidth: 130,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading ? (
              <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} /><span>Crafting{dots}</span></>
            ) : "✨ Generate"}
          </button>
        </div>
        <p style={{ marginTop: 8, fontSize: 12, color: "var(--text3)", textAlign: "center" }}>
          Press Enter to generate · Shift+Enter for new line
        </p>
      </div>

      {/* Preview */}
      {generated && (
        <div className="fade-in" style={{ width: "100%", maxWidth: 900, marginTop: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>✅ Preview</span>
            <div style={{ display: "flex", gap: 8 }}>
              <DownloadBtn html={generated} prompt={prompt} plan={user?.plan} />
              <button style={{
                background: "var(--surface2)", border: "1px solid var(--border2)",
                color: "var(--text2)", padding: "6px 14px", borderRadius: 8, fontSize: 13,
                cursor: "pointer", fontFamily: "var(--font-body)",
              }}>🚀 Deploy (Coming Soon)</button>
            </div>
          </div>
          <div className="glass" style={{ borderRadius: 16, overflow: "hidden", height: 480, position: "relative" }}>
            <PreviewFrame html={generated} plan={user?.plan} />
          </div>
        </div>
      )}

      {/* Orbit visual */}
      <div style={{ marginTop: 80 }}>
        <OrbitRing />
      </div>

      {/* Scroll indicator */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text3)", letterSpacing: 2, textTransform: "uppercase" }}>Scroll to explore</span>
        <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, var(--violet), transparent)" }} />
      </div>
    </section>
  );
};

// ─── IFRAME PREVIEW ───────────────────────────────────────────────────────────
const PreviewFrame = ({ html, plan }) => {
  const planWatermark = PLANS[plan]?.watermark ?? true;
  const finalHtml = planWatermark
    ? html.replace("</body>", `<div style="position:fixed;bottom:12px;right:12px;background:rgba(0,0,0,0.7);color:#fff;padding:6px 12px;border-radius:8px;font-size:11px;font-family:sans-serif;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15)">🚀 Built with Webzy AI</div></body>`)
    : html;
  return (
    <iframe
      srcDoc={finalHtml}
      style={{ width: "100%", height: "100%", border: "none" }}
      title="Generated Website Preview"
      sandbox="allow-scripts"
    />
  );
};

// ─── DOWNLOAD BUTTON ──────────────────────────────────────────────────────────
const DownloadBtn = ({ html, prompt, plan }) => {
  const download = () => {
    const planWatermark = PLANS[plan]?.watermark ?? true;
    const watermarkScript = planWatermark ? `
      const wm = document.createElement('div');
      wm.innerHTML = '🚀 Built with Webzy AI';
      Object.assign(wm.style, {position:'fixed',bottom:'12px',right:'12px',background:'rgba(0,0,0,0.7)',color:'#fff',padding:'6px 12px',borderRadius:'8px',fontSize:'11px',fontFamily:'sans-serif',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)',zIndex:'9999'});
      document.body.appendChild(wm);` : "";
    const finalHtml = html.replace("</body>", `<script>${watermarkScript}<\/script></body>`);
    const a = document.createElement("a");
    a.href = "data:text/html;charset=utf-8," + encodeURIComponent(finalHtml);
    a.download = `webzy-${prompt.slice(0, 20).replace(/\s+/g, "-")}.html`;
    a.click();
  };

  return (
    <button onClick={download} className="glow-btn" style={{
      background: "var(--surface2)", border: "1px solid var(--border2)",
      color: "var(--text1)", padding: "6px 14px", borderRadius: 8, fontSize: 13,
      cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 6,
    }}>
      ⬇ Download
    </button>
  );
};

// ─── FEATURES SECTION ─────────────────────────────────────────────────────────
const features = [
  { icon: "🤖", title: "AI-Powered Generation", desc: "Describe your vision in plain English. Our AI understands context, style, and intent to create precisely what you imagine.", color: "#7c3aed" },
  { icon: "🎨", title: "3D Animations", desc: "Every website ships with fluid 3D transitions, parallax effects, and micro-interactions that make visitors stop and stare.", color: "#3b82f6" },
  { icon: "📱", title: "Fully Responsive", desc: "Auto-optimized for every screen size from smartwatches to 4K displays. Your site looks perfect everywhere, always.", color: "#06b6d4" },
  { icon: "📦", title: "Export Clean Code", desc: "Download production-ready HTML, CSS and JS. No lock-in, no proprietary formats — your code, your way.", color: "#8b5cf6" },
  { icon: "⚡", title: "Instant Preview", desc: "See your website render in real time as AI builds it. Iterate with natural language prompts until it's perfect.", color: "#6366f1" },
  { icon: "🔒", title: "No-Code Required", desc: "Zero technical knowledge needed. From first-time creators to seasoned designers — everyone ships faster with Webzy.", color: "#22d3ee" },
];

const Features = () => (
  <section style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 64 }}>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "var(--violet)", display: "block", marginBottom: 12 }}>Why Webzy 3D</span>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-1.5px" }}>
        Everything you need to{" "}
        <span style={{ background: "var(--grad2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>build faster</span>
      </h2>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {features.map((f, i) => (
        <div key={i} className="glass" style={{
          borderRadius: 16, padding: 28,
          transition: "transform 0.25s, border-color 0.25s, box-shadow 0.25s",
          cursor: "default",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = f.color + "60";
            e.currentTarget.style.boxShadow = `0 0 30px ${f.color}25`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, marginBottom: 10, color: "var(--text1)" }}>{f.title}</h3>
          <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

// ─── PRICING ──────────────────────────────────────────────────────────────────
const Pricing = ({ user, setUser, setPage }) => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleBuy = (plan) => {
    window.open(RAZORPAY[plan], "_blank");
    setSelectedPayment(plan);
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result);
    reader.readAsDataURL(file);
  };

  const submitVerification = () => {
    setSubmitted(true);
    if (user) {
      const updated = { ...user, plan: selectedPayment, pendingVerification: true };
      LS.set("webzy_user", updated);
      setUser(updated);
    }
  };

  const plans = [
    { key: "Basic", popular: false, features: ["3 websites/month", "AI generation", "Export HTML", "🚀 Watermark included", "Email support"] },
    { key: "Pro", popular: true, features: ["20 websites/month", "AI generation", "Export HTML", "No watermark", "Priority support", "Advanced templates"] },
    { key: "Premium", popular: false, features: ["Unlimited websites", "AI generation", "Export HTML", "No watermark", "Priority speed 🔥", "Dedicated support", "Early features"] },
  ];

  return (
    <section id="pricing" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "var(--violet)", display: "block", marginBottom: 12 }}>Pricing</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-1.5px" }}>
          Simple, transparent{" "}
          <span style={{ background: "var(--grad1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>pricing</span>
        </h2>
        <p style={{ marginTop: 16, color: "var(--text2)", fontSize: 17 }}>Start free. Upgrade when you're ready.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {plans.map(({ key, popular, features: fs }) => (
          <div key={key} style={{
            borderRadius: 20,
            padding: 32,
            position: "relative",
            background: popular ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.15))" : "var(--surface)",
            border: popular ? "1px solid rgba(139,92,246,0.5)" : "1px solid var(--border)",
            boxShadow: popular ? "0 0 50px rgba(124,58,237,0.2)" : "none",
            transition: "transform 0.25s",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {popular && (
              <div style={{
                position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                background: "var(--grad1)", color: "#fff", fontSize: 12, fontWeight: 700,
                padding: "4px 16px", borderRadius: 100, letterSpacing: 1,
              }}>MOST POPULAR</div>
            )}
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: PLANS[key].color, letterSpacing: 1, textTransform: "uppercase" }}>{key}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 42 }}>₹{PLANS[key].price}</span>
              <span style={{ color: "var(--text3)", fontSize: 14 }}>/month</span>
            </div>
            <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 28 }}>
              {key === "Premium" ? "Unlimited" : PLANS[key].sites} website{PLANS[key].sites !== 1 ? "s" : ""}/month
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {fs.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 14, color: "var(--text2)" }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => user ? handleBuy(key) : setPage("signup")} className="glow-btn" style={{
              width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
              background: popular ? "var(--grad1)" : "var(--surface2)",
              border: popular ? "none" : "1px solid var(--border2)",
              color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
              cursor: "pointer",
            }}>
              {user ? `Get ${key}` : "Get started"}
            </button>
          </div>
        ))}
      </div>

      {/* Payment verification */}
      {selectedPayment && !submitted && (
        <div className="fade-in glass" style={{ borderRadius: 20, padding: 32, marginTop: 40, maxWidth: 500, margin: "40px auto 0" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>📸 Upload Payment Proof</h3>
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>After completing payment, upload your screenshot for manual verification (usually within 24h).</p>
          <input type="file" accept="image/*" onChange={handleScreenshotUpload} style={{ marginBottom: 16 }} />
          {screenshot && <img src={screenshot} alt="proof" style={{ width: "100%", borderRadius: 10, marginBottom: 16, maxHeight: 200, objectFit: "contain" }} />}
          <button onClick={submitVerification} disabled={!screenshot} className="glow-btn" style={{
            width: "100%", padding: 12, borderRadius: 10, border: "none",
            background: screenshot ? "var(--grad1)" : "var(--surface2)",
            color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, cursor: screenshot ? "pointer" : "not-allowed",
          }}>Submit for Verification</button>
        </div>
      )}

      {submitted && (
        <div className="fade-in glass" style={{ borderRadius: 20, padding: 32, marginTop: 40, maxWidth: 500, margin: "40px auto 0", textAlign: "center", border: "1px solid rgba(34,197,94,0.3)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Verification Submitted!</h3>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>We'll review your payment and activate your {selectedPayment} plan within 24 hours. You'll receive a confirmation email.</p>
        </div>
      )}
    </section>
  );
};

// ─── AUTH FORMS ───────────────────────────────────────────────────────────────
const AuthForm = ({ mode, setPage, setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setError(""); setLoading(true);
    setTimeout(() => {
      if (mode === "signup") {
        const users = LS.get("webzy_users") || {};
        if (users[email]) { setError("Email already registered."); setLoading(false); return; }
        const newUser = { email, name, plan: "Basic", createdAt: new Date().toISOString() };
        users[email] = { ...newUser, password };
        LS.set("webzy_users", users);
        LS.set("webzy_user", newUser);
        setUser(newUser);
        setPage("dashboard");
      } else {
        const users = LS.get("webzy_users") || {};
        const found = users[email];
        if (!found || found.password !== password) { setError("Invalid email or password."); setLoading(false); return; }
        const u = { email: found.email, name: found.name, plan: found.plan };
        LS.set("webzy_user", u);
        setUser(u);
        setPage("dashboard");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 60px" }}>
      <div className="glass" style={{ borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: "var(--grad1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#fff",
            margin: "0 auto 16px", boxShadow: "0 0 30px var(--glow-p)",
          }}>W</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 6 }}>
            {mode === "login" ? "Sign in to your Webzy account" : "Start building amazing websites"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Arjun Sharma" />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>

          {error && <p style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{error}</p>}

          <button onClick={submit} disabled={loading} className="glow-btn" style={{
            marginTop: 8, width: "100%", padding: 13, borderRadius: 10, border: "none",
            background: "var(--grad1)", color: "#fff",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : mode === "login" ? "Sign in" : "Create account →"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text2)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setPage(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "var(--violet)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600 }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ user, setPage }) => {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setHistory(LS.get("webzy_history") || []);
  }, []);

  const deleteItem = (id) => {
    const h = history.filter(x => x.id !== id);
    setHistory(h);
    LS.set("webzy_history", h);
    if (selected?.id === id) setSelected(null);
  };

  const plan = PLANS[user?.plan] || PLANS.Basic;

  return (
    <div style={{ minHeight: "100vh", padding: "100px 24px 60px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-1px" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--text2)", marginTop: 6, fontSize: 15 }}>
            Welcome back, <strong style={{ color: "var(--text1)" }}>{user?.name || user?.email}</strong>
          </p>
        </div>
        <button onClick={() => setPage("home")} className="glow-btn" style={{
          background: "var(--grad1)", border: "none", color: "#fff",
          padding: "12px 24px", borderRadius: 10, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}>✨ Generate New</button>
      </div>

      {/* Plan card */}
      <div className="glass" style={{
        borderRadius: 16, padding: 24, marginBottom: 32,
        borderColor: plan.color + "50",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, color: plan.color, textTransform: "uppercase" }}>Current Plan</span>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, marginTop: 4 }}>{user?.plan || "Basic"}</h3>
          {user?.pendingVerification && (
            <p style={{ color: "#f59e0b", fontSize: 13, marginTop: 4 }}>⏳ Payment verification pending</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: plan.color }}>{history.length}</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Sites generated</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32 }}>
              {plan.sites === Infinity ? "∞" : plan.sites}
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Sites/month</div>
          </div>
        </div>
        <button onClick={() => setPage("pricing")} style={{
          background: "var(--surface2)", border: "1px solid var(--border2)",
          color: "var(--text1)", padding: "10px 20px", borderRadius: 10,
          fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>Upgrade Plan ↗</button>
      </div>

      {/* History */}
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, marginBottom: 20 }}>Generated Websites</h2>

      {history.length === 0 ? (
        <div className="glass" style={{ borderRadius: 16, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌐</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>No websites yet</h3>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Generate your first website from the home page</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {history.map(item => (
              <div key={item.id} className="glass" style={{
                borderRadius: 14, overflow: "hidden", cursor: "pointer",
                border: selected?.id === item.id ? "1px solid var(--violet)" : "1px solid var(--border)",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: selected?.id === item.id ? "0 0 20px var(--glow-p)" : "none",
              }} onClick={() => setSelected(selected?.id === item.id ? null : item)}>
                <div style={{ height: 140, overflow: "hidden", pointerEvents: "none" }}>
                  <iframe srcDoc={item.html} style={{ width: "100%", height: 400, border: "none", transform: "scale(0.35)", transformOrigin: "top left", pointerEvents: "none" }} sandbox="allow-scripts" title={item.prompt} />
                </div>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>{item.prompt}</p>
                    <p style={{ fontSize: 11, color: "var(--text3)" }}>{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <DownloadBtn html={item.html} prompt={item.prompt} plan={user?.plan} />
                    <button onClick={e => { e.stopPropagation(); deleteItem(item.id); }} style={{
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                      color: "#f87171", padding: "4px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                    }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selected && (
            <div className="fade-in glass" style={{ borderRadius: 16, overflow: "hidden", position: "sticky", top: 80 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.prompt}</span>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
              <div style={{ height: 480 }}>
                <PreviewFrame html={selected.html} plan={user?.plan} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = ({ setPage }) => (
  <footer style={{ borderTop: "1px solid var(--border)", padding: "60px 24px 40px", marginTop: 80 }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40, marginBottom: 48 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--grad1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "#fff" }}>W</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>Webzy 3D</span>
          </div>
          <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7, maxWidth: 220 }}>
            AI-powered website builder for the next generation of creators.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            {["𝕏", "in", "▶"].map((icon, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 8,
                background: "var(--surface2)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, cursor: "pointer", transition: "border-color 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--violet)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >{icon}</div>
            ))}
          </div>
        </div>
        {[
          { title: "Product", links: ["Features", "Pricing", "Dashboard", "Templates"] },
          { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
          { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Refund Policy"] },
        ].map(col => (
          <div key={col.title}>
            <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, marginBottom: 16, color: "var(--text1)" }}>{col.title}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.links.map(l => (
                <a key={l} href="#" style={{ color: "var(--text2)", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text1)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text2)"}
                >{l}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <p style={{ color: "var(--text3)", fontSize: 13 }}>© 2025 Webzy 3D. All rights reserved.</p>
        <p style={{ color: "var(--text3)", fontSize: 13 }}>Made with ❤️ in India 🇮🇳</p>
      </div>
    </div>
  </footer>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => LS.get("webzy_user"));

  const logout = () => {
    LS.del("webzy_user");
    setUser(null);
    setPage("home");
  };

  const renderPage = () => {
    switch (page) {
      case "home": return (
        <>
          <Hero user={user} setPage={setPage} />
          <Features />
          <Pricing user={user} setUser={setUser} setPage={setPage} />
        </>
      );
      case "pricing": return <Pricing user={user} setUser={setUser} setPage={setPage} />;
      case "login": return <AuthForm mode="login" setPage={setPage} setUser={setUser} />;
      case "signup": return <AuthForm mode="signup" setPage={setPage} setUser={setUser} />;
      case "dashboard": return user ? <Dashboard user={user} setPage={setPage} /> : <AuthForm mode="login" setPage={setPage} setUser={setUser} />;
      default: return <Hero user={user} setPage={setPage} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <BgOrbs />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Nav user={user} page={page} setPage={setPage} onLogout={logout} />
        <main>{renderPage()}</main>
        <Footer setPage={setPage} />
      </div>
    </>
  );
}
