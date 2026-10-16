/* เสียงเอฟเฟกต์ สร้างสดด้วย Web Audio ไม่ต้องโหลดไฟล์เสียง
   ปุ่มเปิด/ปิดเสียงคือทุกปุ่มที่มี class "sound-btn" (จำค่าไว้ใน localStorage) */
const sfx = (() => {
  let ac = null, master = null;
  let muted = store.get("muted", false) === true;

  // เบราว์เซอร์ยอมให้เริ่มเสียงหลังผู้ใช้แตะจอเท่านั้น จึงสร้างตอนเรียกใช้ครั้งแรก
  function audio() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ac = new AC(); } catch { return null; }
      master = ac.createGain();
      master.gain.value = 0.6;
      master.connect(ac.destination);
    }
    if (ac.state === "suspended") ac.resume().catch(() => {});
    return ac;
  }

  // โน้ตเดียว: ดังขึ้นเร็วแล้วค่อยๆ จาง
  function note(freq, at, dur, { type = "sine", vol = 0.15, to } = {}) {
    const t = ac.currentTime + at;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // เสียงฟึ่บตอนพลิกไพ่: noise ที่กรองความถี่ไล่ขึ้น
  function swish(dur = 0.22) {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();
    const t = ac.currentTime;
    src.buffer = buf;
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + dur);
    gain.gain.value = 0.3;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t);
  }

  const SOUNDS = {
    flip: () => swish(),
    tap: () => note(880, 0, 0.08, { type: "triangle", vol: 0.07 }),
    chime: () => { note(1318.5, 0, 0.5, { vol: 0.12 }); note(1975.5, 0.07, 0.6, { vol: 0.09 }); },
    sparkle: () => [1568, 2093, 2637].forEach((f, i) => note(f, i * 0.06, 0.35, { vol: 0.06 })),
    wrong: () => note(330, 0, 0.28, { type: "triangle", vol: 0.1, to: 210 }),
    win: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.09, 0.5, { type: "triangle", vol: 0.1 })),
  };

  function play(name) {
    if (muted || !SOUNDS[name] || !audio()) return;
    try { SOUNDS[name](); } catch {}
  }

  function sync() {
    document.querySelectorAll(".sound-btn").forEach((btn) => {
      btn.innerHTML = ic(muted ? "volume-x" : "volume-2");
      btn.setAttribute("aria-pressed", String(!muted));
      btn.setAttribute("aria-label", muted ? "เปิดเสียงเอฟเฟกต์" : "ปิดเสียงเอฟเฟกต์");
    });
  }

  document.querySelectorAll(".sound-btn").forEach((btn) => (btn.onclick = () => {
    muted = !muted;
    store.set("muted", muted);
    sync();
    play("tap");
  }));
  /* ปลดล็อกเสียง: เบราว์เซอร์มือถือนับเฉพาะ "ยกนิ้ว / คลิก / กดปุ่ม" เป็นการอนุญาต (แตะลงไม่นับ)
     จึงฟังหลายแบบไว้ แล้วเลิกฟังเมื่อเสียงพร้อมเล่นจริง
     เล่น buffer เงียบ 1 ครั้งด้วย เพราะ iOS รุ่นเก่าต้องมีเสียงเล่นในจังหวะที่ผู้ใช้แตะ */
  const UNLOCK = ["pointerup", "touchend", "click", "keydown"];
  function unlock() {
    if (muted || !audio()) return;
    try {
      const src = ac.createBufferSource();
      src.buffer = ac.createBuffer(1, 1, 22050);
      src.connect(ac.destination);
      src.start(0);
    } catch {}
    if (ac.state === "running") UNLOCK.forEach((t) => removeEventListener(t, unlock, true));
  }
  UNLOCK.forEach((t) => addEventListener(t, unlock, true));
  sync();

  return { play };
})();
