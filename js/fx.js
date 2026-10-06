/* เอฟเฟกต์ประกาย: ฝุ่นทองลอย + ประกายตามนิ้ว/เมาส์ + ระเบิดประกาย + นางฟ้าบินผ่าน */
const fx = (() => {
  const canvas = $("fx");
  const ctx = canvas.getContext("2d");
  const PALETTES = {
    talk: ["#e9c77b", "#f5dca6", "#f3c6d3", "#d9c9f2", "#c8e3f5", "#ffffff"],
    quiz: ["#b9a4ec", "#d8ccf3", "#f3c6e3", "#bfe3f2", "#ffffff", "#c6f0dc"],
    case: ["#e3c07a", "#f5dca6", "#ffffff", "#9fb8e8", "#c7b3f0"],
  };
  let colors = PALETTES.talk;
  const scale = isLite ? 0.55 : 1;
  const parts = [];
  const dust = [];
  let W = 0, H = 0;

  const pick = () => colors[(Math.random() * colors.length) | 0];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function sparkle(x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.fill();
    ctx.restore();
  }

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

  let t = 0;
  function loop() {
    t++;
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
    requestAnimationFrame(loop);
  }

  resize();
  initDust();
  addEventListener("resize", () => { resize(); initDust(); });
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
  return { burst, burstAt, setTheme, fairyFlyBy, GOLD };
})();
