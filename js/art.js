/* ภาพการ์ตูน SVG: นางฟ้าประจำเว็บ + ตัวการ์ตูนเล็กๆ ประจำสำรับไพ่ */
const ART = (() => {
  // ดาว 5 แฉกรอบจุด (cx, cy)
  function starPath(cx, cy, R, r) {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r : R;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      d += `${i ? "L" : "M"}${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`;
    }
    return d + "Z";
  }

  // หน้าการ์ตูน: ตา แก้มแดง ปากยิ้ม (sleepy = หลับตายิ้ม)
  function face(cx, cy, s = 1, sleepy = false) {
    const ex = 5 * s, ey = cy - 1 * s;
    const eyes = sleepy
      ? `<path d="M${cx - ex - 2 * s} ${ey} q${2 * s} ${2 * s} ${4 * s} 0 M${cx + ex - 2 * s} ${ey} q${2 * s} ${2 * s} ${4 * s} 0" fill="none" stroke="#5a4660" stroke-width="${1.4 * s}" stroke-linecap="round"/>`
      : `<ellipse class="pal-eye" cx="${cx - ex}" cy="${ey}" rx="${1.5 * s}" ry="${2 * s}" fill="#5a4660"/><ellipse class="pal-eye" cx="${cx + ex}" cy="${ey}" rx="${1.5 * s}" ry="${2 * s}" fill="#5a4660"/>`;
    return eyes +
      `<ellipse cx="${cx - ex - 2.5 * s}" cy="${cy + 3 * s}" rx="${2.2 * s}" ry="${1.4 * s}" fill="#f59fb4" opacity=".7"/>` +
      `<ellipse cx="${cx + ex + 2.5 * s}" cy="${cy + 3 * s}" rx="${2.2 * s}" ry="${1.4 * s}" fill="#f59fb4" opacity=".7"/>` +
      `<path d="M${cx - 2.2 * s} ${cy + 2.6 * s} q${2.2 * s} ${2.4 * s} ${4.4 * s} 0" fill="none" stroke="#5a4660" stroke-width="${1.3 * s}" stroke-linecap="round"/>`;
  }

  const svg = (body) => `<svg viewBox="0 0 60 60" aria-hidden="true">${body}</svg>`;
  const petals = [0, 72, 144, 216, 288].map((deg) =>
    `<ellipse cx="30" cy="16" rx="9" ry="11" fill="#f7b9cb" stroke="#e992ab" stroke-width="1.2" transform="rotate(${deg} 30 31)"/>`).join("");
  const rays = Array.from({ length: 8 }, (_, i) =>
    `<line x1="30" y1="6" x2="30" y2="11" stroke="#f3a964" stroke-width="3" stroke-linecap="round" transform="rotate(${i * 45} 30 31)"/>`).join("");

  // ตัวการ์ตูนประจำสำรับ เรียกตาม id ของสำรับ
  const PALS = {
    star: svg(`<path d="${starPath(30, 32, 26, 12)}" fill="#f8d77e" stroke="#dcaa45" stroke-width="2" stroke-linejoin="round"/>${face(30, 34, 1)}`),
    flower: svg(`${petals}<circle cx="30" cy="31" r="11" fill="#ffe69a" stroke="#e8bf55" stroke-width="1.2"/>${face(30, 31, 0.85)}`),
    moon: svg(`<path d="M38 7a25 25 0 1 0 15 38A21 21 0 1 1 38 7z" fill="#ddd2f7" stroke="#a995e0" stroke-width="2" stroke-linejoin="round"/>${face(25, 36, 0.9, true)}<path d="M47 12l1.2 2.8 2.8 1.2-2.8 1.2L47 20l-1.2-2.8-2.8-1.2 2.8-1.2z" fill="#f8d77e"/>`),
    dawn: svg(`${rays}<circle cx="30" cy="31" r="15" fill="#ffd28f" stroke="#f0a55a" stroke-width="2"/>${face(30, 32, 1)}`),
    aurora: svg(`<path d="M10 30a20 20 0 0 1 40 0" fill="none" stroke="#f7a8bf" stroke-width="4" stroke-linecap="round"/><path d="M15 30a15 15 0 0 1 30 0" fill="none" stroke="#f8d77e" stroke-width="4" stroke-linecap="round"/><path d="M20 30a10 10 0 0 1 20 0" fill="none" stroke="#9fd8c4" stroke-width="4" stroke-linecap="round"/><path d="M14 52a8 8 0 0 1 1-16 11 11 0 0 1 21-3 9 9 0 0 1 10 19z" fill="#fff" stroke="#bcd3ea" stroke-width="2" stroke-linejoin="round"/>${face(30, 44, 0.85)}`),
    heart: svg(`<path d="M30 52C14 41 7 32 7 23a11 11 0 0 1 23-6 11 11 0 0 1 23 6c0 9-7 18-23 29z" fill="#f7b3c4" stroke="#e48aa3" stroke-width="2" stroke-linejoin="round"/>${face(30, 29, 1)}`),
  };

  // นางฟ้าประจำเว็บ ท่าทางเปลี่ยนด้วย CSS ตาม data-pose (idle / happy / confused / point)
  const FAIRY = `<svg class="fy" viewBox="0 0 100 120" aria-hidden="true">
    <defs>
      <radialGradient id="fyGlow"><stop offset="0" stop-color="#fff3c4" stop-opacity=".9"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
      <linearGradient id="fyWing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ddff" stop-opacity=".95"/><stop offset="1" stop-color="#fbd3e4" stop-opacity=".7"/></linearGradient>
      <linearGradient id="fyDress" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbd0de"/><stop offset="1" stop-color="#e3c4f3"/></linearGradient>
    </defs>
    <circle class="fy-glow" cx="50" cy="62" r="46" fill="url(#fyGlow)"/>
    <g class="fy-wing fy-wl" fill="url(#fyWing)" stroke="#c9b6f5" stroke-width="1">
      <path d="M48 58C30 30 8 34 12 52c2 10 20 14 36 10z"/><path d="M48 64C34 70 22 84 32 88c8 2 14-10 16-22z"/>
    </g>
    <g class="fy-wing fy-wr" fill="url(#fyWing)" stroke="#c9b6f5" stroke-width="1">
      <path d="M52 58C70 30 92 34 88 52c-2 10-20 14-36 10z"/><path d="M52 64C66 70 78 84 68 88c-8 2-14-10-16-22z"/>
    </g>
    <g class="fy-body">
      <path d="M46 92l-2 12M54 92l2 12" stroke="#f5cdb8" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M50 57L35 94q15 6 30 0z" fill="url(#fyDress)" stroke="#e6a9c2" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M39 86q11 4 22 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
      <g class="fy-arm fy-al">
        <path d="M45 64L34 74" stroke="#f5cdb8" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M34 74L25 60" stroke="#c9a45c" stroke-width="1.8" stroke-linecap="round"/>
        <path class="fy-wand" d="${starPath(25, 57, 6, 2.6)}" fill="#f8d77e" stroke="#dcaa45" stroke-width=".8" stroke-linejoin="round"/>
      </g>
      <g class="fy-arm fy-ar"><path d="M55 64L66 74" stroke="#f5cdb8" stroke-width="3.2" stroke-linecap="round"/></g>
      <g class="fy-head">
        <circle cx="50" cy="22" r="7" fill="#fbf4ea" stroke="#e5d3b3" stroke-width="1"/>
        <circle cx="50" cy="40" r="17" fill="#fbf4ea" stroke="#e5d3b3" stroke-width="1"/>
        <circle cx="50" cy="43" r="12.5" fill="#ffe4d4"/>
        <path d="M37 40q3-12 13-11q10-1 13 11q-6-6-13-5q-7-1-13 5z" fill="#fbf4ea"/>
        <path d="${starPath(50, 28, 3.6, 1.6)}" fill="#f8d77e" stroke="#dcaa45" stroke-width=".6"/>
        <g class="fy-eyes"><ellipse cx="45" cy="44" rx="1.7" ry="2.3" fill="#4a3f55"/><ellipse cx="55" cy="44" rx="1.7" ry="2.3" fill="#4a3f55"/></g>
        <ellipse cx="41.5" cy="48" rx="2.4" ry="1.5" fill="#f59fb4" opacity=".65"/><ellipse cx="58.5" cy="48" rx="2.4" ry="1.5" fill="#f59fb4" opacity=".65"/>
        <path class="fy-m fy-smile" d="M47 49q3 2.6 6 0" fill="none" stroke="#a0566e" stroke-width="1.3" stroke-linecap="round"/>
        <path class="fy-m fy-grin" d="M46 48.6q4 6 8 0z" fill="#c4607c" stroke="#a0566e" stroke-width=".8" stroke-linejoin="round"/>
        <ellipse class="fy-m fy-oh" cx="50" cy="50" rx="1.6" ry="2" fill="#a0566e"/>
      </g>
    </g>
    <text class="fy-q" x="76" y="30" font-size="20" font-weight="700" fill="#8d6fd6">?</text>
    <g class="fy-sparks" fill="#f8d77e">
      <path d="${starPath(14, 22, 5, 2)}"/><path d="${starPath(86, 18, 4, 1.6)}"/><path d="${starPath(90, 70, 4.5, 1.8)}"/>
    </g>
  </svg>`;

  return { PALS, FAIRY };
})();
