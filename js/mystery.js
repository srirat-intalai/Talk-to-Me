/* ไขคดีและปริศนา: คดีสืบสวน / ปริศนาตัวเลือก / เกมข้ามแม่น้ำ */
const Mystery = (() => {
  const best = () => store.get("best", {});
  function saveBest(id, stars) {
    const b = best();
    if ((b[id] || 0) < stars) { b[id] = stars; store.set("best", b); }
  }
  const starText = (n) => "★".repeat(n) + "☆".repeat(3 - n);

  function renderList() {
    const b = best();
    let i = 0;
    $("mysteryList").innerHTML = MYSTERY_GROUPS.map((g) =>
      `<h3 class="group-title">${g.title}</h3>` + g.items.map((m) => menuItem({
        id: m.id, icon: m.icon, color: m.color, title: m.title, i: i++,
        sub: m.type === "case" ? `ระดับ${m.level} · ${m.setting}` : (m.type === "river" ? "เกมพายเรือ เล่นได้จริง" : "ปริศนาหาคำตอบ"),
        badge: b[m.id] ? starText(b[m.id]) : (m.type === "case" ? m.level : ""),
      })).join("")
    ).join("");
    bindMenu($("mysteryList"), (id) => {
      const m = [...CASES, ...RIDDLES].find((x) => x.id === id);
      if (m.type === "case") Case.start(m);
      else if (m.type === "riddle") Riddle.start(m);
      else River.start(m);
    });
  }

  /* ================= คดีสืบสวน ================= */
  const Case = (() => {
    let c, revealed, hintUsed, wrong, accused;

    function start(data) {
      c = data;
      revealed = new Set();
      hintUsed = false;
      wrong = 0;
      accused = null;
      $("caseTitle").textContent = `${c.icon} ${c.title}`;
      render();
      show("case-play");
    }

    function render() {
      const allSeen = revealed.size === c.clues.length;
      $("caseProgress").textContent = `หลักฐาน ${revealed.size}/${c.clues.length}`;
      $("caseBody").innerHTML = `
        <div class="panel case-file">
          <div class="case-meta">📁 แฟ้มคดี · ระดับ${c.level}</div>
          <h2>${c.title}</h2>
          <div class="case-meta">${c.setting}</div>
          <p class="case-story">${c.story}</p>
        </div>

        <div class="block-title">🧑‍🤝‍🧑 ผู้ต้องสงสัย <small>${c.suspects.length} คน</small></div>
        <div class="suspects">${c.suspects.map((s) => `
          <div class="suspect"><span class="avatar">${s.emoji}</span>
            <div><strong>${s.name}</strong><small>${s.role}</small><q>${s.says}</q></div>
          </div>`).join("")}
        </div>

        <div class="block-title">🔍 หลักฐาน <small id="clueCount">แตะเพื่อตรวจ · ${revealed.size}/${c.clues.length}</small></div>
        <div class="clues">${c.clues.map((cl, i) => clueHtml(cl, i)).join("")}</div>

        ${hintUsed ? `<div class="hint-box">💡 ${c.hint}</div>` : ""}

        <div class="row-btns">
          <button class="btn btn-ghost" id="hintBtn" ${hintUsed ? "disabled" : ""}>💡 ขอคำใบ้ (−1 ดาว)</button>
        </div>
        <div class="stack-btns" style="margin-top:10px">
          <button class="btn btn-primary" id="accuseBtn" ${allSeen ? "" : "disabled"}>
            ${allSeen ? "🔎 ชี้ตัวคนร้าย" : `ตรวจหลักฐานให้ครบก่อน (${revealed.size}/${c.clues.length})`}
          </button>
        </div>`;

      $("caseBody").querySelectorAll(".clue").forEach((el) => (el.onclick = () => reveal(el)));
      $("hintBtn").onclick = () => { hintUsed = true; render(); toast("ได้คำใบ้แล้ว 💡"); };
      $("accuseBtn").onclick = () => accuseStep1();
    }

    function clueHtml(cl, i) {
      return revealed.has(cl.id)
        ? `<button class="clue" data-id="${cl.id}"><div class="c-head"><span class="c-icon">${cl.icon}</span>${cl.title}</div><p>${cl.text}</p></button>`
        : `<button class="clue hidden" data-id="${cl.id}"><div><span class="q">🔍</span>หลักฐาน #${i + 1}<br><small>แตะเพื่อตรวจ</small></div></button>`;
    }

    // พลิกการ์ดหลักฐาน: หมุนไปครึ่งทาง → เปลี่ยนเนื้อหา → หมุนกลับ
    function reveal(el) {
      const id = el.dataset.id;
      if (revealed.has(id)) return;
      revealed.add(id);
      const cl = c.clues.find((x) => x.id === id);
      const i = c.clues.indexOf(cl);
      const swap = () => {
        el.outerHTML = clueHtml(cl, i);
        const fresh = $("caseBody").querySelector(`.clue[data-id="${id}"]`);
        if (!reduceMotion) fresh.animate([{ transform: "rotateY(-90deg)" }, { transform: "rotateY(0)" }], { duration: 260, easing: "ease-out" });
        fx.burstAt(fresh, { n: 16, speed: 3.5, size: 6, life: 50 });
        if (revealed.size === c.clues.length) setTimeout(render, 450);
        else {
          $("caseProgress").textContent = `หลักฐาน ${revealed.size}/${c.clues.length}`;
          $("accuseBtn").textContent = `ตรวจหลักฐานให้ครบก่อน (${revealed.size}/${c.clues.length})`;
          $("clueCount").textContent = `แตะเพื่อตรวจ · ${revealed.size}/${c.clues.length}`;
        }
      };
      if (reduceMotion) swap();
      else el.animate([{ transform: "rotateY(0)" }, { transform: "rotateY(90deg)" }], { duration: 180, easing: "ease-in" }).onfinish = swap;
    }

    function accuseStep1() {
      $("accuseTitle").textContent = "ใครคือคนร้าย?";
      $("accuseBody").innerHTML = `
        <p class="section-sub">เลือกผู้ต้องสงสัย 1 คน</p>
        <div class="suspects">${c.suspects.map((s) => `
          <button class="suspect" data-id="${s.id}"><span class="avatar">${s.emoji}</span>
            <div><strong>${s.name}</strong><small>${s.role}</small><q>${s.says}</q></div>
          </button>`).join("")}
        </div>`;
      $("accuseBody").querySelectorAll(".suspect").forEach((b) => (b.onclick = () => {
        accused = b.dataset.id;
        if (accused !== c.culprit) return wrongGuess();
        accuseStep2();
      }));
      show("case-accuse");
    }

    function accuseStep2() {
      const s = c.suspects.find((x) => x.id === accused);
      $("accuseTitle").textContent = "หลักฐานไหนมัดตัว?";
      $("accuseBody").innerHTML = `
        <p class="section-sub">ชี้ตัว <b>${s.emoji} ${s.name}</b> แล้ว<br>หลักฐานชิ้นไหนสำคัญที่สุดที่ทำให้มั่นใจ?</p>
        <div class="clues">${c.clues.map((cl) => `
          <button class="clue" data-id="${cl.id}"><div class="c-head"><span class="c-icon">${cl.icon}</span>${cl.title}</div><p>${cl.text}</p></button>`).join("")}
        </div>`;
      $("accuseBody").querySelectorAll(".clue").forEach((b) => (b.onclick = () => solved(c.key.includes(b.dataset.id))));
      window.scrollTo(0, 0);
    }

    function wrongGuess() {
      const s = c.suspects.find((x) => x.id === accused);
      $("caseResult").innerHTML = `
        <div class="orb"><div class="halo"></div><span>🤔</span></div>
        <h2>ยังไม่ใช่นะ...</h2>
        <p class="muted">${s.emoji} ${s.name} มีหลักฐานที่ฟังขึ้นอยู่<br>ลองอ่านคำให้การเทียบกับหลักฐานอีกที</p>
        <div class="stack-btns">
          <button class="btn btn-primary" id="caseRetry">กลับไปสืบต่อ (−1 ดาว)</button>
          <button class="btn btn-ghost" id="caseGiveUp">ยอมแพ้ ดูเฉลย</button>
        </div>`;
      $("caseRetry").onclick = () => { wrong++; render(); show("case-play"); };
      $("caseGiveUp").onclick = () => showSolution(0, false);
      show("case-result");
      $("caseResult").classList.remove("shake");
      void $("caseResult").offsetWidth;
      $("caseResult").classList.add("shake");
    }

    function solved(keyOk) {
      const stars = Math.max(1, 3 - (keyOk ? 0 : 1) - (hintUsed ? 1 : 0) - wrong);
      saveBest(c.id, stars);
      showSolution(stars, keyOk);
      fx.fairyFlyBy();
    }

    function showSolution(stars, keyOk) {
      const win = stars > 0;
      const keyClues = c.clues.filter((cl) => c.key.includes(cl.id)).map((cl) => `${cl.icon} ${cl.title}`).join(" หรือ ");
      $("caseResult").innerHTML = `
        <div class="orb"><div class="halo"></div><span>${win ? "🏆" : "📜"}</span></div>
        <h2>${win ? "ไขคดีสำเร็จ!" : "เฉลยคดี"}</h2>
        ${win ? `<div class="stars">${starsHtml(stars)}</div>` : ""}
        ${win && !keyOk ? `<p class="muted">จับคนร้ายถูก แต่หลักฐานมัดตัวที่ดีที่สุดคือ ${keyClues}</p>` : ""}
        <div class="solution" style="white-space:pre-line">${c.solution}</div>
        <div class="stack-btns">
          <button class="btn btn-primary" data-go="mystery-list">เลือกคดีอื่น</button>
          <button class="btn btn-ghost" id="caseReplay">เล่นคดีนี้ใหม่</button>
        </div>`;
      $("caseReplay").onclick = () => start(c);
      show("case-result");
      if (win) requestAnimationFrame(() => fx.burstAt($("caseResult").querySelector(".orb"), { n: 90, speed: 8, size: 9, life: 100, palette: fx.GOLD }));
      renderList();
    }

    return { start };
  })();

  /* ================= ปริศนาตัวเลือก ================= */
  const Riddle = (() => {
    let r, wrong, hintUsed, done;

    function start(data) {
      r = data;
      wrong = 0;
      hintUsed = false;
      done = false;
      $("riddleTitle").textContent = `${r.icon} ${r.title}`;
      render();
      show("riddle-play");
    }

    function render() {
      $("riddleBody").innerHTML = `
        <div class="panel case-file" id="riddlePanel">
          <div class="orb sm"><div class="halo"></div><span>${r.icon}</span></div>
          <p class="case-story">${r.story}</p>
        </div>
        <div class="block-title">❓ ${r.question}</div>
        <div class="opts" id="riddleOpts" style="width:100%">${r.options.map((o, i) =>
          `<button class="opt" data-i="${i}" style="--i:${i}">${o}</button>`).join("")}
        </div>
        <div id="riddleHint"></div>
        <div class="row-btns"><button class="btn btn-ghost" id="riddleHintBtn">💡 ขอคำใบ้ (−1 ดาว)</button></div>
        <div id="riddleAnswer" style="width:100%"></div>`;
      $("riddleOpts").querySelectorAll(".opt").forEach((b) => (b.onclick = () => pick(Number(b.dataset.i), b)));
      $("riddleHintBtn").onclick = () => {
        hintUsed = true;
        $("riddleHint").innerHTML = `<div class="hint-box">💡 ${r.hint}</div>`;
        $("riddleHintBtn").disabled = true;
      };
    }

    function pick(i, btn) {
      if (done) return;
      if (i !== r.answer) {
        wrong++;
        btn.classList.add("wrong");
        btn.disabled = true;
        btn.animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 300 });
        toast("ยังไม่ใช่ ลองใหม่อีกที!");
        return;
      }
      done = true;
      btn.classList.add("correct");
      $("riddleOpts").querySelectorAll(".opt").forEach((b) => (b.disabled = true));
      $("riddleHintBtn").disabled = true;
      const stars = Math.max(1, 3 - wrong - (hintUsed ? 1 : 0));
      saveBest(r.id, stars);
      $("riddleAnswer").innerHTML = `
        <div class="panel" style="margin-top:18px">
          <h2>ถูกต้อง! 🎉</h2>
          <div class="stars">${starsHtml(stars)}</div>
          <div class="solution" style="white-space:pre-line">${r.explain}</div>
          <div class="stack-btns">
            <button class="btn btn-primary" id="riddleNext">ปริศนาถัดไป</button>
            <button class="btn btn-ghost" data-go="mystery-list">กลับหน้ารวม</button>
          </div>
        </div>`;
      $("riddleNext").onclick = nextPuzzle;
      fx.burstAt(btn, { n: 60, speed: 7, size: 8, life: 80, palette: fx.GOLD });
      setTimeout(() => $("riddleAnswer").scrollIntoView({ behavior: "smooth", block: "start" }), 300);
      renderList();
    }

    function nextPuzzle() {
      const list = RIDDLES;
      const n = list[(list.indexOf(r) + 1) % list.length];
      if (n.type === "river") River.start(n); else start(n);
    }

    return { start };
  })();

  /* ================= เกมข้ามแม่น้ำ ================= */
  const River = (() => {
    const ITEMS = { wolf: "🐺", goat: "🐐", cabbage: "🥬" };
    const NAMES = { wolf: "หมาป่า", goat: "แพะ", cabbage: "กะหล่ำ" };
    let g, me, pos, cargo, trips, over, moving;

    function start(data) {
      g = data;
      me = 0;
      pos = { wolf: 0, goat: 0, cabbage: 0 };
      cargo = null;
      trips = 0;
      over = false;
      moving = false;
      $("riverTitle").textContent = `${g.icon} ${g.title}`;
      $("riverBody").innerHTML = `
        <div class="panel case-file">
          <p class="case-story" style="margin-bottom:10px">${g.story}</p>
          <ul class="rules">${g.rules.map((x) => `<li>${x}</li>`).join("")}</ul>
        </div>
        <div class="river-board" id="riverBoard">
          <div class="bank" id="bank0"></div>
          <div class="water"><div class="boat" id="boat"></div></div>
          <div class="bank far" id="bank1"></div>
        </div>
        <div class="river-status" id="riverStatus"></div>
        <div class="row-btns" style="margin-top:6px">
          <button class="btn btn-primary" id="rowBtn">🚣 พายเรือ</button>
        </div>
        <div class="row-btns">
          <button class="btn btn-ghost" id="riverReset">↻ เริ่มใหม่</button>
          <button class="btn btn-ghost" id="riverSolve">ดูเฉลย</button>
        </div>
        <div id="riverEnd" style="width:100%"></div>`;
      $("rowBtn").onclick = row;
      $("riverReset").onclick = () => start(g);
      $("riverSolve").onclick = () => end(0);
      render();
      status("แตะของบนฝั่งเพื่อขึ้นเรือ แล้วกด 'พายเรือ'");
      show("river-play");
    }

    function status(msg, bad = false) {
      const s = $("riverStatus");
      s.textContent = msg;
      s.classList.toggle("bad", bad);
    }

    function render() {
      [0, 1].forEach((side) => {
        const bank = $("bank" + side);
        const here = Object.keys(ITEMS).filter((k) => pos[k] === side && cargo !== k);
        bank.innerHTML = `<div class="label">${side === 0 ? "ฝั่งนี้" : "ฝั่งโน้น"}</div>` +
          here.map((k) => `<button class="token" data-k="${k}" aria-label="${NAMES[k]}" ${side !== me || cargo || over || moving ? "disabled" : ""}>${ITEMS[k]}</button>`).join("");
      });
      const boat = $("boat");
      boat.classList.toggle("far", me === 1);
      boat.innerHTML = `<span class="token me">🧑</span>` +
        (cargo ? `<button class="token" data-k="${cargo}" aria-label="เอา${NAMES[cargo]}ลง" ${over || moving ? "disabled" : ""}>${ITEMS[cargo]}</button>` : "");
      $("riverBoard").querySelectorAll(".token[data-k]").forEach((t) => (t.onclick = () => toggle(t.dataset.k)));
      $("rowBtn").disabled = over || moving;
    }

    function toggle(k) {
      if (over || moving) return;
      cargo = cargo === k ? null : k;
      render();
      status(cargo ? `${ITEMS[cargo]} ขึ้นเรือแล้ว กด 'พายเรือ' ได้เลย` : "เอาลงจากเรือแล้ว");
    }

    function row() {
      if (over || moving) return;
      moving = true;
      me = 1 - me;
      if (cargo) pos[cargo] = me;
      trips++;
      render();
      status(`เที่ยวที่ ${trips} กำลังพาย... 🌊`);
      setTimeout(arrive, reduceMotion ? 50 : 1000);
    }

    function arrive() {
      moving = false;
      cargo = null; // ถึงฝั่งแล้ววางของลงอัตโนมัติ
      const other = 1 - me;
      const left = Object.keys(ITEMS).filter((k) => pos[k] === other);
      const has = (k) => left.includes(k);
      if (has("wolf") && has("goat")) return fail("🐺 หมาป่ากินแพะไปแล้ว! ห้ามทิ้งสองตัวนี้ไว้ด้วยกัน");
      if (has("goat") && has("cabbage")) return fail("🐐 แพะกินกะหล่ำไปแล้ว! ห้ามทิ้งสองอย่างนี้ไว้ด้วยกัน");
      render();
      if (Object.values(pos).every((p) => p === 1)) {
        const stars = trips <= 7 ? 3 : trips <= 9 ? 2 : 1;
        saveBest(g.id, stars);
        status(`ข้ามครบทั้งหมดใน ${trips} เที่ยว! 🎉`);
        fx.burstAt($("riverBoard"), { n: 90, speed: 8, size: 9, life: 100, palette: fx.GOLD });
        fx.fairyFlyBy();
        end(stars);
      } else {
        status(`ถึง${me === 1 ? "ฝั่งโน้น" : "ฝั่งนี้"}แล้ว · เที่ยวที่ ${trips}`);
      }
    }

    function fail(msg) {
      over = true;
      render();
      status(msg, true);
      const b = $("riverBoard");
      b.classList.remove("shake");
      void b.offsetWidth;
      b.classList.add("shake");
    }

    function end(stars) {
      over = true;
      render();
      $("riverEnd").innerHTML = `
        <div class="panel" style="margin-top:16px">
          <h2>${stars ? "พาข้ามสำเร็จ!" : "เฉลย"}</h2>
          ${stars ? `<div class="stars">${starsHtml(stars)}</div><p class="muted">ใช้ไป ${trips} เที่ยว (น้อยสุดที่ทำได้คือ 7 เที่ยว)</p>` : ""}
          <div class="solution" style="white-space:pre-line">${g.explain}</div>
          <div class="stack-btns">
            <button class="btn btn-primary" id="riverAgain">เล่นอีกรอบ</button>
            <button class="btn btn-ghost" data-go="mystery-list">กลับหน้ารวม</button>
          </div>
        </div>`;
      $("riverAgain").onclick = () => start(g);
      setTimeout(() => $("riverEnd").scrollIntoView({ behavior: "smooth", block: "start" }), 300);
      renderList();
    }

    return { start };
  })();

  return { renderList };
})();
