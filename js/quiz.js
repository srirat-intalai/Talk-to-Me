/* แบบทดสอบ: score / axes / experiment */
const Quiz = (() => {
  let quiz = null, idx = 0, answers = [], busy = false;

  function renderList() {
    const last = store.get("quizResults", {});
    let i = 0;
    $("quizList").innerHTML = QUIZ_GROUPS.map((g) => {
      const items = QUIZZES.filter((q) => q.group === g.id);
      return `<h3 class="group-title">${g.title}</h3>` + items.map((q) => {
        const r = last[q.id];
        return menuItem({
          id: q.id, icon: q.icon, color: q.color, title: q.title, sub: q.sub, i: i++,
          badge: r ? `ล่าสุด: ${r}` : (q.questions.length > 1 ? `${q.questions.length} ข้อ` : "1 ข้อ"),
        });
      }).join("");
    }).join("");
    bindMenu($("quizList"), (id) => start(QUIZZES.find((q) => q.id === id)));
  }

  function start(q) {
    quiz = q;
    idx = 0;
    answers = [];
    busy = false;
    $("quizTitle").textContent = `${q.icon} ${q.title}`;
    show("quiz-play");
    renderQ();
  }

  function renderQ() {
    const q = quiz.questions[idx];
    const total = quiz.questions.length;
    $("quizProgress").textContent = `ข้อ ${idx + 1} จาก ${total}`;
    $("quizBar").style.width = `${(idx / total) * 100}%`;
    $("quizScene").textContent = q.icon || quiz.icon;
    $("quizQ").textContent = q.q;
    $("quizOpts").innerHTML = q.options.map((o, i) =>
      `<button class="opt${answers[idx] === i ? " picked" : ""}" data-i="${i}" style="--i:${i}">${o.t}</button>`
    ).join("");
    $("quizOpts").querySelectorAll(".opt").forEach((b) => (b.onclick = () => pick(Number(b.dataset.i), b)));
    const cardEl = $("quizCard");
    cardEl.classList.remove("enter");
    void cardEl.offsetWidth;
    cardEl.classList.add("enter");
  }

  function pick(i, btn) {
    if (busy) return;
    busy = true;
    answers[idx] = i;
    $("quizOpts").querySelectorAll(".opt").forEach((b) => b.classList.toggle("picked", b === btn));
    fx.burstAt(btn, { n: 14, speed: 3.5, size: 6, life: 50 });
    setTimeout(() => {
      busy = false;
      idx++;
      if (idx >= quiz.questions.length) finish();
      else renderQ();
    }, 380);
  }

  function back() {
    if (idx > 0) { idx--; renderQ(); }
    else show("quiz-list");
  }

  function tally() {
    const scores = {};
    answers.forEach((oi, qi) => {
      const s = quiz.questions[qi].options[oi].s || {};
      Object.entries(s).forEach(([k, v]) => (scores[k] = (scores[k] || 0) + v));
    });
    return scores;
  }

  const listBox = (title, items) => items && items.length
    ? `<div class="result-box"><h3>${title}</h3><ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : "";

  function finish() {
    let html, saveAs, shareMsg;

    if (quiz.mode === "experiment") {
      const verdict = quiz.verdict(answers);
      html = `
        <div class="orb"><div class="halo"></div><span>${quiz.icon}</span></div>
        <div class="kicker">ผลการทดลอง</div>
        <h2>${quiz.title}</h2>
        <p class="result-tag">${quiz.sub}</p>
        <div class="answers">${quiz.questions.map((q, i) => `
          <div class="result-box"><small>${q.icon} ${q.short}</small><b>➜ ${q.options[answers[i]].t}</b></div>`).join("")}
        </div>
        <div class="result-box highlight" style="margin-bottom:14px"><p>${verdict}</p></div>
        <div class="result-box" style="margin-bottom:8px"><h3>🔍 เบื้องหลังการทดลอง</h3>
          ${quiz.insights.map((p) => `<p style="white-space:pre-line">${p}</p>`).join("")}
        </div>`;
      saveAs = "เล่นแล้ว";
      shareMsg = `ลองเล่น "${quiz.title}" ใน Talk to Me แล้ว: ${verdict}`;
    } else {
      const scores = tally();
      let key, bars = "";
      if (quiz.mode === "axes") {
        key = quiz.axes.map(([a, b]) => ((scores[a] || 0) >= (scores[b] || 0) ? a : b)).join("");
        bars = `<div class="bars"><h3>สัดส่วนแต่ละด้าน</h3>${quiz.axes.map(([a, b]) => {
          const ta = scores[a] || 0, tb = scores[b] || 0;
          const pct = Math.round((ta / (ta + tb || 1)) * 100);
          return `<div class="bar-row">
            <div class="labels"><span><b>${a}</b> ${quiz.axisLabels[a]}</span><span>${quiz.axisLabels[b]} <b>${b}</b></span></div>
            <div class="track"><span data-w="${pct}"></span></div></div>`;
        }).join("")}</div>`;
      } else {
        const keys = Object.keys(quiz.results);
        key = keys.reduce((best, k) => ((scores[k] || 0) > (scores[best] || 0) ? k : best), keys[0]);
        if (quiz.questions.length > 1) {
          const total = answers.length;
          bars = `<div class="bars"><h3>คะแนนแต่ละแบบ</h3>${keys
            .map((k) => ({ k, v: scores[k] || 0 }))
            .sort((x, y) => y.v - x.v)
            .map(({ k, v }) => `<div class="bar-row">
              <div class="labels"><span>${quiz.results[k].emoji} ${quiz.results[k].name}</span><b>${Math.round((v / total) * 100)}%</b></div>
              <div class="track"><span data-w="${(v / total) * 100}"></span></div></div>`).join("")}</div>`;
        }
      }
      const r = quiz.results[key];
      const [la, lb] = quiz.lists || ["จุดเด่น", "ระวังนิดนึง"];
      // ตัวเลือกที่มีคำวิเคราะห์ของตัวเอง (n) → แสดงทีละด่าน
      const notes = answers
        .map((oi, qi) => ({ q: quiz.questions[qi], o: quiz.questions[qi].options[oi] }))
        .filter((x) => x.o.n);
      const notesHtml = notes.length
        ? `<div class="result-box" style="margin-bottom:16px"><h3>🔮 บทวิเคราะห์รายด่าน</h3>${notes
            .map((x) => `<p><b>${x.q.icon} ${x.q.short}</b><br>${x.o.n}</p>`).join("")}</div>`
        : "";
      html = `
        <div class="orb"><div class="halo"></div><span>${r.emoji}</span></div>
        <div class="kicker">ผลลัพธ์ของเรา</div>
        <h2>${r.name}</h2>
        ${r.tag ? `<p class="result-tag">${r.tag}</p>` : ""}
        <p class="result-desc">${r.desc}</p>
        <div class="result-cols two">${listBox(la, r.a)}${listBox(lb, r.b)}</div>
        ${r.match ? `<p class="match">💞 เข้ากันได้ดีกับ <b>${r.match}</b></p>` : ""}
        ${notesHtml}
        ${bars}`;
      saveAs = quiz.mode === "axes" ? key : r.name;
      shareMsg = `เราได้ "${r.name}" จากแบบทดสอบ ${quiz.title} ใน Talk to Me ✨`;
    }

    html += `${quiz.note ? `<p class="note">${quiz.note}</p>` : ""}
      <div class="stack-btns">
        <button class="btn btn-primary" id="quizShare">แชร์ผลลัพธ์ ✨</button>
        <div class="row-btns" style="margin-top:0">
          <button class="btn btn-ghost" id="quizAgain">เล่นอีกรอบ</button>
          <button class="btn btn-ghost" data-go="quiz-list">เกมอื่น</button>
        </div>
      </div>`;

    $("quizResult").innerHTML = html;
    const all = store.get("quizResults", {});
    all[quiz.id] = saveAs;
    store.set("quizResults", all);

    $("quizShare").onclick = () => shareText(shareMsg);
    $("quizAgain").onclick = () => start(quiz);
    show("quiz-result");
    requestAnimationFrame(() => {
      $("quizResult").querySelectorAll(".track span").forEach((s) => (s.style.width = s.dataset.w + "%"));
      fx.burstAt($("quizResult").querySelector(".orb"), { n: 70, speed: 7, size: 8, life: 90 });
    });
    renderList();
  }

  $("quizBack").onclick = back;
  return { renderList };
})();
