/* เอฟเฟกต์ประกาย: ฝุ่นทองลอย + ประกายตามนิ้ว/เมาส์ + ระเบิดประกาย + นางฟ้าบินผ่าน + พลุ
   พื้นหลังตามธีม (วาดบน #bgfx หลังเนื้อหา): talk กลีบดอกไม้ร่วง · quiz ฟองแสงลอย · case ดาวตก */
const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  const bg = $("bgfx");
  const bctx = bg.getContext("2d");
  const PALETTES = {
    talk: ["#e9c77b", "#f5dca6", "#f3c6d3", "#d9c9f2", "#c8e3f5", "#ffffff"],
    quiz: ["#b9a4ec", "#d8ccf3", "#f3c6e3", "#bfe3f2", "#ffffff", "#c6f0dc"],
    case: ["#e3c07a", "#f5dca6", "#ffffff", "#9fb8e8", "#c7b3f0"],
  };
  let colors = PALETTES.talk;
  const scale = isLite ? 0.55 : 1;
  const parts = [];
  const dust = [];
  const ambient = [];
  const streaks = [];
  const rockets = [];
  let theme = "talk";
  let nextStreak = 0;
  let W = 0, H = 0;

  const pick = () => colors[(Math.random() * colors.length) | 0];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    for (const [c, x] of [[canvas, ctx], [bg, bctx]]) {
      c.width = W * dpr; c.height = H * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function sparkleOn(c, x, y, r, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(0, -r);
    c.quadraticCurveTo(0, 0, r, 0);
    c.quadraticCurveTo(0, 0, 0, r);
    c.quadraticCurveTo(0, 0, -r, 0);
    c.quadraticCurveTo(0, 0, 0, -r);
    c.fill();
    c.restore();
  }
  const sparkle = (x, y, r, rot) => sparkleOn(ctx, x, y, r, rot);

  function burst(x, y, { n = 30, speed = 5, size = 7, gravity = 0.06, life = 70, palette } = {}) {
    if (reduceMotion) return;
    const count = Math.max(1, Math.round(n * scale));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.9);
      const l = life * (0.6 + Math.random() * 0.6);
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1,
        g: gravity, r: size * (0.4 + Math.random() * 0.8),
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
        life: l, max: l,
        c: palette ? palette[(Math.random() * palette.length) | 0] : pick(),
      });
    }
  }

  function initDust() {
    dust.length = 0;
    const count = Math.round(Math.min(isLite ? 28 : 60, (W * H) / 18000));
    for (let i = 0; i < count; i++) {
      dust.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1.5 + Math.random() * 3.5, vy: -(0.1 + Math.random() * 0.35),
        sway: Math.random() * Math.PI * 2, tw: 0.02 + Math.random() * 0.04,
        c: pick(),
      });
    }
  }

  /* ---------- พื้นหลังตามธีม ---------- */
  const PETALS = ["#f6c3d2", "#f9d5df", "#fbe1d6", "#f3bfd0", "#fde9c8"];

  function spawnAmbient(anywhere) {
    if (theme === "talk") {
      ambient.push({
        x: Math.random() * W, y: anywhere ? Math.random() * H : -20,
        r: 5 + Math.random() * 5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.04,
        vy: 0.35 + Math.random() * 0.6, sway: Math.random() * 6.28, flip: 0.02 + Math.random() * 0.03,
        c: PETALS[(Math.random() * PETALS.length) | 0],
      });
    } else if (theme === "quiz") {
      ambient.push({
        x: Math.random() * W, y: anywhere ? Math.random() * H : H + 30,
        r: 6 + Math.random() * 14, vy: -(0.2 + Math.random() * 0.45), sway: Math.random() * 6.28,
        c: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  function initAmbient() {
    ambient.length = 0;
    if (theme === "case") return;
    const n = Math.round(Math.min(isLite ? 10 : 22, (W * H) / 40000)) + 4;
    for (let i = 0; i < n; i++) spawnAmbient(true);
  }

  function petal(p) {
    bctx.save();
    bctx.translate(p.x, p.y);
    bctx.rotate(p.rot);
    // ย่อแกน x ตาม cos ให้ดูเหมือนกลีบพลิกไปมากลางอากาศ
    bctx.scale(Math.max(0.15, Math.abs(Math.cos(t * p.flip + p.sway))), 1);
    bctx.beginPath();
    bctx.moveTo(0, -p.r);
    bctx.quadraticCurveTo(p.r * 0.95, -p.r * 0.2, 0, p.r);
    bctx.quadraticCurveTo(-p.r * 0.95, -p.r * 0.2, 0, -p.r);
    bctx.fillStyle = p.c;
    bctx.globalAlpha = 0.6;
    bctx.fill();
    bctx.restore();
  }

  function bubble(b) {
    const g = bctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
    g.addColorStop(0, "rgba(255,255,255,.75)");
    g.addColorStop(0.6, b.c);
    g.addColorStop(1, "rgba(255,255,255,0)");
    bctx.globalAlpha = 0.35;
    bctx.fillStyle = g;
    bctx.beginPath();
    bctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    bctx.fill();
    bctx.globalAlpha = 0.45;
    bctx.strokeStyle = "rgba(255,255,255,.8)";
    bctx.lineWidth = 1;
    bctx.stroke();
  }

  function drawAmbient() {
    bctx.clearRect(0, 0, W, H);
    for (let i = ambient.length - 1; i >= 0; i--) {
      const a = ambient[i];
      a.y += a.vy;
      a.x += Math.sin(t * 0.012 + a.sway) * (theme === "talk" ? 0.6 : 0.3);
      if (a.rot !== undefined) a.rot += a.vr;
      const gone = a.vy > 0 ? a.y > H + 20 : a.y < -40;
      if (gone) { ambient.splice(i, 1); spawnAmbient(false); continue; }
      if (theme === "talk") petal(a); else bubble(a);
    }
    bctx.globalAlpha = 1;
    if (theme === "case" && t >= nextStreak) {
      shootStar(true);
      nextStreak = t + 150 + Math.random() * 240;
    }
    drawStreaks(bctx, true);
  }

  /* ---------- ดาวตก ---------- */
  // ambient = ดาวตกพื้นหลังของธีม case (วาดหลังเนื้อหา) / ไม่ใช่ = ดาวตกฉลอง (วาดหน้าเนื้อหา)
  function shootStar(ambientStar) {
    streaks.push({
      x: W * (0.35 + Math.random() * 0.75), y: -20 + Math.random() * H * 0.3,
      vx: -(7 + Math.random() * 5), vy: 3 + Math.random() * 2.5,
      len: 9 + Math.random() * 6, life: 70, max: 70, back: !!ambientStar,
    });
  }

  function drawStreaks(c, back) {
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      if (s.back !== back) continue;
      s.x += s.vx; s.y += s.vy; s.life--;
      if (s.life <= 0 || s.x < -200 || s.y > H + 200) { streaks.splice(i, 1); continue; }
      const tx = s.x - s.vx * s.len, ty = s.y - s.vy * s.len;
      const g = c.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, "rgba(255,246,214,.95)");
      g.addColorStop(1, "rgba(255,246,214,0)");
      c.globalAlpha = Math.min(1, s.life / 20);
      c.strokeStyle = g;
      c.lineWidth = 2.2;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(s.x, s.y);
      c.lineTo(tx, ty);
      c.stroke();
      c.fillStyle = "#fff6d6";
      sparkleOn(c, s.x, s.y, 4, t * 0.1);
    }
    c.globalAlpha = 1;
  }

  /* ---------- พลุ ---------- */
  const FIREWORK = [["#e9c77b", "#fff3c4", "#ffffff"], ["#f3a6c4", "#ffd6e6", "#ffffff"], ["#b9a4ec", "#d8ccf3", "#ffffff"], ["#9fd8c4", "#c8f0e2", "#ffffff"]];

  function fireworks(shots = 5) {
    if (reduceMotion) return;
    for (let i = 0; i < shots; i++) {
      setTimeout(() => {
        const g = 0.12;
        const height = H * (0.45 + Math.random() * 0.3);
        rockets.push({ x: W * (0.15 + Math.random() * 0.7), y: H + 10, vy: -Math.sqrt(2 * g * height), g });
      }, i * 320);
    }
    for (let i = 0; i < 3; i++) setTimeout(() => shootStar(false), 250 + i * 500);
  }

  function drawRockets() {
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.y += r.vy; r.vy += r.g;
      burst(r.x, r.y, { n: 1, speed: 0.6, size: 3, gravity: 0.02, life: 25, palette: GOLD });
      if (r.vy >= -0.5) {
        rockets.splice(i, 1);
        burst(r.x, r.y, { n: 48, speed: 6.5, size: 7, gravity: 0.05, life: 85, palette: FIREWORK[(Math.random() * FIREWORK.length) | 0] });
      }
    }
  }

  let t = 0;
  function loop() {
    t++;
    drawAmbient();
    ctx.clearRect(0, 0, W, H);

    for (const d of dust) {
      d.y += d.vy;
      d.x += Math.sin(t * 0.01 + d.sway) * 0.2;
      if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
      ctx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(t * d.tw + d.sway));
      ctx.fillStyle = d.c;
      sparkle(d.x, d.y, d.r, t * 0.01 + d.sway);
    }

    if (!isLite) { ctx.shadowColor = "rgba(255,230,170,.9)"; ctx.shadowBlur = 8; }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= 0.97; p.vy = p.vy * 0.97 + p.g;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = p.c;
      sparkle(p.x, p.y, p.r * (0.5 + k * 0.5), p.rot);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    drawRockets();
    drawStreaks(ctx, false);
    requestAnimationFrame(loop);
  }

  resize();
  initDust();
  initAmbient();
  addEventListener("resize", () => { resize(); initDust(); initAmbient(); });
  if (!reduceMotion) requestAnimationFrame(loop);

  let last = 0;
  addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (now - last < 35) return;
    last = now;
    burst(e.clientX, e.clientY, { n: 2, speed: 1.2, size: 5, gravity: 0.03, life: 45 });
  });
  addEventListener("pointerdown", (e) => burst(e.clientX, e.clientY, { n: 12, speed: 3, size: 6, life: 50 }));

  function setTheme(name) {
    colors = PALETTES[name] || PALETTES.talk;
    dust.forEach((d) => (d.c = pick()));
    theme = PALETTES[name] ? name : "talk";
    streaks.length = 0;
    initAmbient();
  }

  // ระเบิดประกายตรงกลางของ element
  function burstAt(el, opts) {
    const c = centerOf(el);
    burst(c.x, c.y, opts);
  }

  function fairyFlyBy() {
    // ภาพนางฟ้าพื้นขาวจะกลายเป็นก้อนแสงบนธีมมืด จึงไม่ให้บินในหมวดไขคดี
    if (reduceMotion || document.body.dataset.theme === "case") return;
    const fairy = $("fairy");
    const vw = innerWidth, vh = innerHeight;
    const anim = fairy.animate([
      { transform: `translate(-160px, ${vh * 0.75}px) rotate(-12deg) scale(.8)`, opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { transform: `translate(${vw * 0.45 - 65}px, ${vh * 0.35}px) rotate(4deg) scale(1)`, offset: 0.55 },
      { opacity: 1, offset: 0.85 },
      { transform: `translate(${vw + 40}px, ${vh * 0.05}px) rotate(14deg) scale(.85)`, opacity: 0 },
    ], { duration: 2600, easing: "ease-in-out" });

    let running = true;
    anim.onfinish = () => (running = false);
    (function trail() {
      if (!running) return;
      const r = fairy.getBoundingClientRect();
      burst(r.left + r.width * 0.75, r.top + r.height * 0.35, { n: 3, speed: 1.5, size: 6, gravity: 0.05, life: 60 });
      requestAnimationFrame(trail);
    })();
  }

  const GOLD = ["#e9c77b", "#f5dca6", "#fff3c4", "#ffffff"];
  return { burst, burstAt, setTheme, fairyFlyBy, fireworks, GOLD };
})();
