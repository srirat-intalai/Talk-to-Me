/* หน้าแรก: เลือกหมวดใหญ่ */
const MODES = [
  { id: "talk-decks", icon: "🃏", color: "#f6dfe6", title: "ไพ่ Deep Talk", sub: `${DECKS.length} สำรับ · ${DECKS.reduce((n, d) => n + d.questions.length, 0)} คำถาม คุยลึก เปิดใจ` },
  { id: "quiz-list", icon: "🔮", color: "#e3dbf6", title: "แบบทดสอบ", sub: `${QUIZZES.length} เกม · เอาตัวรอด จิตวิทยา วัดนิสัย` },
  { id: "mystery-list", icon: "🕵️", color: "#c9c2ea", title: "ไขคดี & ปริศนา", sub: `${CASES.length + RIDDLES.length} เกม · สืบหาคนร้าย ลับสมอง` },
];

$("hubMenu").innerHTML = MODES.map((m, i) => menuItem({ ...m, i, big: true })).join("");
bindMenu($("hubMenu"), (id) => show(id));

Talk.renderDecks();
Quiz.renderList();
Mystery.renderList();

// service worker ใช้ได้เฉพาะตอนเปิดผ่านเว็บจริง (http/https) เปิดจากไฟล์ในเครื่องจะข้ามไป
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
