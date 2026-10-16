/* นางฟ้าตัวน้อยประจำเว็บ: ลอยอยู่มุมขวาล่าง เปลี่ยนท่าตามเหตุการณ์ พร้อมกล่องคำพูด
   ซ่อนตอนเปิดไพ่ (หน้า talk-play) เพราะไพ่กับปุ่มกินพื้นที่เต็มจอ */
const Fairy = (() => {
  const CHEERS = [
    "วันนี้เก่งมากแล้วนะ",
    "ค่อยๆ คิด ไม่ต้องรีบเลย",
    "ทุกคำตอบของเธอมีความหมาย",
    "พักหายใจลึกๆ สักทีก็ได้นะ",
    "เชื่อในตัวเองหน่อย เธอทำได้!",
    "ขอให้วันนี้มีเรื่องดีๆ เข้ามา",
    "ความจริงใจคือเวทมนตร์ที่ดีที่สุด",
    "ไม่ต้องสมบูรณ์แบบ แค่เป็นตัวเองก็พอ",
  ];
  // คำทักครั้งแรกที่เข้าแต่ละหมวด
  const INTRO = {
    "talk-decks": "เลือกสำรับที่ชอบ แล้วมาเปิดใจคุยกันนะ",
    "quiz-list": "อยากรู้จักตัวเองมุมไหน เลือกได้เลย",
    "mystery-list": "นักสืบพร้อมไหม? ความจริงซ่อนในรายละเอียดนะ",
  };

  const root = document.createElement("div");
  root.className = "fairy";
  root.dataset.pose = "idle";
  root.innerHTML = `<div class="fairy-say" role="status" aria-live="polite"></div>
    <button class="fairy-btn" type="button" aria-label="นางฟ้าผู้ช่วย แตะเพื่อรับกำลังใจ">${ART.FAIRY}</button>`;
  document.body.appendChild(root);
  const bubble = root.querySelector(".fairy-say");
  const btn = root.querySelector(".fairy-btn");

  const greeted = new Set();
  let poseTimer, sayTimer, lastCheer = -1;

  function pose(name, ms = 2400) {
    clearTimeout(poseTimer);
    root.dataset.pose = name;
    if (name !== "idle") poseTimer = setTimeout(() => (root.dataset.pose = "idle"), ms);
  }

  function say(text, p = "idle", ms = 3200) {
    pose(p, ms);
    clearTimeout(sayTimer);
    bubble.textContent = text;
    bubble.classList.add("show");
    sayTimer = setTimeout(() => bubble.classList.remove("show"), ms);
  }

  const pick = (list) => list[(Math.random() * list.length) | 0];

  btn.onclick = () => {
    // ไม่สุ่มซ้ำประโยคเดิมติดกัน
    let i;
    do { i = (Math.random() * CHEERS.length) | 0; } while (i === lastCheer && CHEERS.length > 1);
    lastCheer = i;
    say(CHEERS[i], "happy");
    sfx.play("sparkle");
    fx.burstAt(btn, { n: 22, speed: 4, size: 6, life: 60, palette: fx.GOLD });
  };

  // เรียกจาก show() ทุกครั้งที่เปลี่ยนหน้า
  function onScreen(id) {
    if (INTRO[id] && !greeted.has(id)) {
      greeted.add(id);
      setTimeout(() => say(INTRO[id], "point"), 500);
    }
  }

  setTimeout(() => {
    greeted.add("hub");
    if ($("hub").classList.contains("active")) say("สวัสดี! วันนี้อยากเล่นอะไรดี", "happy");
  }, 900);

  return { say, pose, pick, onScreen };
})();
