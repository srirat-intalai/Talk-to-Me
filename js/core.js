/* ฟังก์ชันพื้นฐานที่ทุกหมวดใช้ร่วมกัน */
const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// เครื่องเล็กหรือสเปกต่ำ: ลดจำนวนประกายลง
const isLite = Math.min(innerWidth, innerHeight) < 600 || (navigator.hardwareConcurrency || 8) <= 4;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// localStorage อาจใช้ไม่ได้ (โหมดส่วนตัว ฯลฯ) จึงห่อ try/catch ไว้ทุกครั้ง
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("ttm:" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("ttm:" + key, JSON.stringify(value)); } catch {}
  },
};

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function show(id) {
  const target = $(id);
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s === target));
  const theme = target.dataset.theme || "talk";
  if (document.body.dataset.theme !== theme) {
    document.body.dataset.theme = theme;
    if (window.fx) fx.setTheme(theme);
    // สีแถบเบราว์เซอร์บนมือถือให้เข้ากับธีม
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = { talk: "#fbefe9", quiz: "#f1ebfd", case: "#15142a" }[theme];
  }
  window.scrollTo(0, 0);
}

// กล่องถามแบบ 2 ปุ่ม คืนค่า true/false (กด Esc = false)
function ask(msg, yes = "ตกลง", no = "ยกเลิก") {
  return new Promise((resolve) => {
    const modal = $("modal");
    const yesBtn = $("modalYes");
    const noBtn = $("modalNo");
    $("modalMsg").textContent = msg;
    yesBtn.textContent = yes;
    noBtn.textContent = no;
    modal.hidden = false;

    const done = (value) => {
      modal.hidden = true;
      yesBtn.onclick = noBtn.onclick = null;
      document.removeEventListener("keydown", onKey);
      resolve(value);
    };
    const onKey = (e) => { if (e.key === "Escape") done(false); };
    yesBtn.onclick = () => done(true);
    noBtn.onclick = () => done(false);
    document.addEventListener("keydown", onKey);
    yesBtn.focus();
  });
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function menuItem({ id, icon, color, title, sub, badge = "", i = 0, big = false }) {
  return `<button class="menu-btn${big ? " big" : ""}" data-id="${id}" style="--i:${i}">
    <span class="menu-dot" style="--c:${color}">${icon}</span>
    <span class="menu-text"><strong>${title}</strong><small>${sub}</small></span>
    ${badge ? `<span class="menu-badge">${badge}</span>` : ""}
  </button>`;
}

function bindMenu(container, handler) {
  container.querySelectorAll(".menu-btn").forEach((b) => (b.onclick = () => handler(b.dataset.id)));
}

function starsHtml(n) {
  return [0, 1, 2].map((i) => (i < n ? `<span class="on" style="animation-delay:${i * 150}ms">★</span>` : "★")).join("");
}

// ปุ่มที่มี data-go="screen-id" จะพาไปหน้านั้น
document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) show(go.dataset.go);
});

async function shareText(text) {
  const url = location.protocol.startsWith("http") ? location.href.split("#")[0] : "";
  try {
    if (navigator.share) {
      await navigator.share({ text, url: url || undefined });
      return;
    }
    await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
    toast("คัดลอกผลลัพธ์แล้ว ✨");
  } catch {
    // ผู้ใช้กดยกเลิกการแชร์ ไม่ต้องทำอะไร
  }
}
