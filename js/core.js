/* ฟังก์ชันพื้นฐานที่ทุกหมวดใช้ร่วมกัน */
const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// เครื่องเล็กหรือสเปกต่ำ: ลดจำนวนประกายลง
const isLite = Math.min(innerWidth, innerHeight) < 600 || (navigator.hardwareConcurrency || 8) <= 4;

// <i data-ic="ชื่อ"> ใน index.html → ไอคอนจริง
document.querySelectorAll("[data-ic]").forEach((el) => (el.outerHTML = ic(el.dataset.ic)));

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

// ข้อมูลใน localStorage ถูกแก้จากภายนอกได้ (เว็บอื่นใน origin เดียวกัน / แก้มือ)
// ก่อนใช้ต้องเช็กชนิด และ escape ก่อนเอาไปใส่ innerHTML
const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function show(id) {
  const target = $(id);
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s === target));
  document.body.dataset.screen = id;
  if (typeof Fairy !== "undefined") Fairy.onScreen(id);
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
// icon: ชื่อไอคอนที่จะแสดงท้ายข้อความ (ไม่ใส่ก็ได้)
function toast(msg, icon) {
  const t = $("toast");
  t.textContent = msg;
  if (icon) t.insertAdjacentHTML("beforeend", " " + ic(icon));
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function menuItem({ id, icon, color, title, sub, badge = "", i = 0, big = false }) {
  return `<button class="menu-btn${big ? " big" : ""}" data-id="${id}" style="--i:${i}">
    <span class="menu-dot" style="--c:${color}">${ic(icon)}</span>
    <span class="menu-text"><strong>${title}</strong><small>${sub}</small></span>
    ${badge ? `<span class="menu-badge">${badge}</span>` : ""}
  </button>`;
}

// ตัวเลขที่มี data-count จะนับขึ้นจาก 0 ไปจนถึงค่านั้น (ต่อท้ายด้วย data-suffix)
function countUp(root, ms = 900) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = end + suffix; return; }
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function bindMenu(container, handler) {
  container.querySelectorAll(".menu-btn").forEach((b) => (b.onclick = () => handler(b.dataset.id)));
}

function starsHtml(n) {
  return [0, 1, 2].map((i) => (i < n ? `<span class="on" style="animation-delay:${i * 150}ms">${ic("star")}</span>` : `<span>${ic("star")}</span>`)).join("");
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
    toast("คัดลอกผลลัพธ์แล้ว", "sparkles");
  } catch {
    // ผู้ใช้กดยกเลิกการแชร์ ไม่ต้องทำอะไร
  }
}
