/* ไพ่ Deep Talk */
const Talk = (() => {
  const MAX_PLAYERS = 12;
  const MAX_NAME = 20;
  const MAX_QUESTION = 200;
  const MAX_CUSTOM = 300;
  const MAX_FAVS = 500;

  const state = { deck: null, cards: [], index: -1, flipped: false, busy: false, seen: new Set() };
  const wrap = $("cardWrap");
  const tilt = $("tilt");
  const card = $("card");

  // ข้อมูลที่ผู้เล่นสร้างเอง เก็บใน localStorage (อาจโดนแก้มือ เลยกรองให้เหลือแต่ string)
  const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);
  let players = strings(store.get("players", [])).slice(0, MAX_PLAYERS);
  let custom = strings(store.get("custom", [])).slice(0, MAX_CUSTOM);
  let favs = strings(store.get("favs", [])).slice(0, MAX_FAVS);

  const customDeck = () => ({ id: "custom", name: "คำถามของฉัน", icon: "✏️", color: "#f2e2c4", questions: custom, wish: false });
  const favDeck = () => ({ id: "favs", name: "ไพ่ที่ชอบ", icon: "💛", color: "#f7e7b4", questions: favs, wish: false });

  function findDeck(id) {
    if (id === "custom") return customDeck();
    if (id === "favs") return favDeck();
    return [...DECKS, MIX_DECK].find((d) => d.id === id) || null;
  }

  const clean = (text, max) => text.replace(/\s+/g, " ").trim().slice(0, max);

  /* ---------- ความคืบหน้าที่เล่นค้าง ---------- */
  const allProgress = () => {
    const p = store.get("progress", {});
    return p && typeof p === "object" ? p : {};
  };

  function savedFor(id) {
    const s = allProgress()[id];
    const ok = s && Array.isArray(s.cards) && s.cards.length > 1
      && Number.isInteger(s.index) && s.index >= 0 && s.index < s.cards.length - 1
      && s.cards.every((c) => c && typeof c.t === "string");
    return ok ? s : null;
  }

  function saveProgress() {
    const p = allProgress();
    p[state.deck.id] = {
      index: state.index,
      cards: state.cards.map((c) => ({ t: c.text, w: !!c.wish, d: c.wish ? null : c.deck.id })),
    };
    store.set("progress", p);
  }

  function clearProgress(id) {
    const p = allProgress();
    if (!(id in p)) return;
    delete p[id];
    store.set("progress", p);
  }

  /* ---------- หน้าเลือกสำรับ ---------- */
  function renderDecks() {
    const progress = allProgress();
    const badge = (d, fallback) => (savedFor(d.id) ? `ค้างใบที่ ${progress[d.id].index + 1}` : fallback);
    const main = [...DECKS, MIX_DECK];
    let i = 0;

    // ไพ่ขอพรนับรวมด้วย ให้ตัวเลขตรงกับตอนเล่น (50 คำถาม + ขอพร 2 = 52 ใบ)
    $("deckList").innerHTML =
      main.map((d) => {
        const qs = d.questions ? d.questions.length : d.size;
        return menuItem({
          id: d.id, icon: d.icon, color: d.color, title: d.name, i: i++,
          sub: `${d.id === "mix" ? "สุ่ม " : ""}${qs} คำถาม + ไพ่ขอพร ${WISH_PER_DECK} ใบ`,
          badge: badge(d, `${qs + WISH_PER_DECK} ใบ`),
        });
      }).join("") +
      `<h3 class="group-title" style="margin-top:14px">✨ ของฉัน</h3>` +
      menuItem({
        id: "custom", icon: "✏️", color: "#f2e2c4", title: "คำถามของฉัน", i: i++,
        sub: custom.length ? `${custom.length} คำถามที่เพิ่มเอง` : "ยังไม่มี แตะเพื่อเพิ่มคำถามของตัวเอง",
        badge: custom.length ? badge(customDeck(), `${custom.length} ใบ`) : "",
      }) +
      menuItem({
        id: "favs", icon: "💛", color: "#f7e7b4", title: "ไพ่ที่ชอบ", i: i++,
        sub: favs.length ? `${favs.length} คำถามที่กดหัวใจเก็บไว้` : "กด ♡ ระหว่างเล่น เพื่อเก็บไพ่ที่ชอบไว้ที่นี่",
        badge: favs.length ? badge(favDeck(), `${favs.length} ใบ`) : "",
      });

    bindMenu($("deckList"), (id) => {
      if (id === "custom") return custom.length ? start(customDeck()) : openCustom();
      if (id === "favs") return favs.length ? start(favDeck()) : toast("ยังไม่มีไพ่ที่ชอบ กด ♡ ระหว่างเล่นก่อนนะ");
      start(findDeck(id));
    });
  }

  /* ---------- ผู้เล่น ---------- */
  function renderPlayers() {
    const box = $("playerChips");
    box.innerHTML = "";
    players.forEach((name, i) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = name;
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "✕";
      del.setAttribute("aria-label", `ลบ ${name}`);
      del.onclick = () => {
        players.splice(i, 1);
        store.set("players", players);
        renderPlayers();
      };
      chip.appendChild(del);
      box.appendChild(chip);
    });
    $("playerHint").textContent = players.length
      ? `${players.length} คน · ผลัดกันตอบตามลำดับ`
      : "ไม่ใส่ก็เล่นได้ ใส่ไว้จะบอกว่าตาใครตอบ";
  }

  $("playerForm").onsubmit = (e) => {
    e.preventDefault();
    const input = $("playerInput");
    const name = clean(input.value, MAX_NAME);
    if (!name) return;
    if (players.length >= MAX_PLAYERS) return toast(`ใส่ได้สูงสุด ${MAX_PLAYERS} คน`);
    if (players.includes(name)) return toast("มีชื่อนี้แล้ว");
    players.push(name);
    store.set("players", players);
    input.value = "";
    renderPlayers();
  };

  const playerAt = (i) => (players.length ? players[i % players.length] : null);

  /* ---------- คำถามของฉัน ---------- */
  function openCustom() {
    renderCustom();
    show("talk-custom");
  }

  function renderCustom() {
    const list = $("customList");
    list.innerHTML = "";
    custom.forEach((q, i) => {
      const li = document.createElement("li");
      const text = document.createElement("span");
      text.textContent = q;
      const del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn sm";
      del.textContent = "✕";
      del.setAttribute("aria-label", "ลบคำถามนี้");
      del.onclick = () => {
        custom.splice(i, 1);
        store.set("custom", custom);
        renderCustom();
      };
      li.append(text, del);
      list.appendChild(li);
    });
    $("customCount").textContent = `${custom.length}/${MAX_CUSTOM} ข้อ`;
    $("customEmpty").hidden = custom.length > 0;
    $("customPlay").disabled = custom.length === 0;
  }

  $("customForm").onsubmit = (e) => {
    e.preventDefault();
    const input = $("customInput");
    const q = clean(input.value, MAX_QUESTION);
    if (!q) return toast("พิมพ์คำถามก่อนนะ");
    if (custom.length >= MAX_CUSTOM) return toast(`เพิ่มได้สูงสุด ${MAX_CUSTOM} ข้อ`);
    if (custom.includes(q)) return toast("มีคำถามนี้แล้ว");
    custom.push(q);
    store.set("custom", custom);
    input.value = "";
    renderCustom();
    fx.burstAt($("customForm"), { n: 16, speed: 3.5, size: 6, life: 50 });
  };
  $("customPlay").onclick = () => custom.length && start(customDeck(), true);
  $("customBack").onclick = () => { renderDecks(); show("talk-decks"); };
  $("customOpen").onclick = openCustom;

  /* ---------- เล่นไพ่ ---------- */
  function buildCards(deck) {
    const toCards = (d) => d.questions.map((q) => ({ text: q, deck: d }));
    const cards = deck.id === "mix"
      ? shuffle(DECKS.flatMap(toCards)).slice(0, deck.size)
      : shuffle(toCards(deck));
    if (deck.wish !== false) {
      // แทรกไพ่ขอพรในตำแหน่งสุ่ม (ไม่ใช่ใบแรก)
      shuffle(WISHES).slice(0, WISH_PER_DECK).forEach((w) => {
        const pos = 1 + Math.floor(Math.random() * cards.length);
        cards.splice(pos, 0, { text: w, wish: true });
      });
    }
    return cards;
  }

  async function start(deck, fresh = false) {
    if (!deck) return;
    const saved = fresh ? null : savedFor(deck.id);
    if (saved) {
      const resume = await ask(
        `${deck.icon} ${deck.name}\nเล่นค้างไว้ที่ใบ ${saved.index + 1} จาก ${saved.cards.length}\nจะเล่นต่อไหม?`,
        "เล่นต่อ", "เริ่มใหม่",
      );
      if (resume) {
        const cards = saved.cards.map((c) => ({ text: c.t, wish: c.w, deck: c.w ? null : findDeck(c.d) || deck }));
        return begin(deck, cards, saved.index);
      }
    }
    clearProgress(deck.id);
    begin(deck, buildCards(deck), -1);
  }

  function begin(deck, cards, index) {
    Object.assign(state, { deck, cards, index, flipped: false, busy: false });
    state.seen = new Set(Array.from({ length: index + 1 }, (_, i) => i));
    card.classList.remove("flipped", "deal");
    wrap.classList.remove("wish-glow");
    $("talkTitle").textContent = `${deck.icon} ${deck.name}`;
    $("talk-play").classList.toggle("has-turn", players.length > 0);

    if (index >= 0) {
      fillFront(cards[index]);
      card.classList.add("flipped");
      state.flipped = true;
      wrap.classList.toggle("wish-glow", !!cards[index].wish);
    }
    updateUI();
    show("talk-play");
    void card.offsetWidth; // รีสตาร์ทแอนิเมชันแจกไพ่
    card.classList.add("deal");
  }

  function fillFront(c) {
    const front = $("front");
    front.classList.toggle("wish", !!c.wish);
    front.style.setProperty("--tint", c.wish ? "var(--wish)" : c.deck.color);
    $("badge").textContent = c.wish ? "✨ ไพ่ขอพร ✨" : `${c.deck.icon} ${c.deck.name}`;
    $("question").textContent = c.text;
    $("num").textContent = `${state.index + 1} / ${state.cards.length}`;
  }

  function updateUI() {
    const total = state.cards.length;
    const left = total - state.index - 1;
    $("talkProgress").textContent = state.index < 0 ? `${total} ใบ` : `ใบที่ ${state.index + 1} จาก ${total}`;
    $("talkBar").style.width = `${Math.max(0, (state.index + 1) / total) * 100}%`;
    $("prevBtn").disabled = state.index <= 0;
    $("nextBtn").textContent = state.index < 0 ? "เปิดไพ่" : (state.index >= total - 1 ? "จบสำรับ ✨" : "ใบถัดไป");
    $("stack1").style.opacity = left > 1 ? 1 : 0;
    $("stack2").style.opacity = left > 2 ? 1 : 0;

    const who = playerAt(Math.max(0, state.index));
    $("turnTag").textContent = who ? `🎤 ${state.index < 0 ? "เริ่มที่" : "ตาของ"} ${who}` : "";
    updateFav();
  }

  function updateFav() {
    const c = state.cards[state.index];
    const btn = $("favBtn");
    const on = !!c && !c.wish && favs.includes(c.text);
    btn.disabled = !c || c.wish;
    btn.textContent = on ? "♥" : "♡";
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on);
  }

  function toggleFav() {
    const c = state.cards[state.index];
    if (!c || c.wish) return;
    const i = favs.indexOf(c.text);
    if (i >= 0) {
      favs.splice(i, 1);
      toast("เอาออกจากไพ่ที่ชอบแล้ว");
    } else {
      if (favs.length >= MAX_FAVS) return toast("ไพ่ที่ชอบเต็มแล้ว ลองเอาบางใบออกก่อน");
      favs.push(c.text);
      toast("เก็บไว้ในไพ่ที่ชอบแล้ว 💛");
      fx.burstAt($("favBtn"), { n: 18, speed: 3.5, size: 6, life: 50, palette: fx.GOLD });
    }
    store.set("favs", favs);
    updateFav();
  }

  function next() {
    if (state.busy) return;
    if (state.index >= state.cards.length - 1) return finish();
    goTo(state.index + 1);
  }

  function prev() {
    if (state.busy || state.index <= 0) return;
    goTo(state.index - 1);
  }

  // คว่ำไพ่ก่อน แล้วค่อยเปลี่ยนเนื้อหาและพลิกเปิดใหม่
  function goTo(i) {
    state.busy = true;
    const reveal = () => {
      state.index = i;
      const c = state.cards[i];
      fillFront(c);
      card.classList.remove("deal");
      card.classList.add("flipped");
      state.flipped = true;
      wrap.classList.toggle("wish-glow", !!c.wish);
      updateUI();
      if (i < state.cards.length - 1) saveProgress();
      setTimeout(() => {
        // เอฟเฟกต์ใหญ่เล่นแค่ครั้งแรกที่เปิดเจอใบนั้น
        const firstTime = !state.seen.has(i);
        state.seen.add(i);
        if (firstTime && c.wish) {
          fx.burstAt(wrap, { n: 90, speed: 8, size: 9, life: 100, palette: fx.GOLD });
          fx.fairyFlyBy();
        } else if (firstTime) {
          fx.burstAt(wrap, { n: 28, speed: 5, size: 6 });
        }
        state.busy = false;
      }, 420);
    };
    if (state.flipped) {
      card.classList.remove("flipped");
      state.flipped = false;
      setTimeout(reveal, 450);
    } else {
      reveal();
    }
  }

  function finish() {
    clearProgress(state.deck.id);
    show("talk-end");
    requestAnimationFrame(() => fx.burstAt($("talkEndCard"), { n: 80, speed: 7, size: 8, life: 90 }));
  }

  // ไพ่เอียงตามเมาส์ (เฉพาะเมาส์ บนจอสัมผัสจะไม่ค้าง)
  wrap.addEventListener("pointermove", (e) => {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    tilt.style.transform = `rotateX(${(0.5 - py) * 16}deg) rotateY(${(px - 0.5) * 16}deg)`;
    wrap.style.setProperty("--mx", px * 100 + "%");
    wrap.style.setProperty("--my", py * 100 + "%");
  });
  wrap.addEventListener("pointerleave", () => {
    tilt.style.transform = "";
    wrap.style.removeProperty("--mx");
    wrap.style.removeProperty("--my");
  });

  wrap.onclick = next;
  wrap.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } };
  $("nextBtn").onclick = next;
  $("prevBtn").onclick = prev;
  $("favBtn").onclick = toggleFav;
  $("shuffleBtn").onclick = () => start(state.deck, true);
  $("againBtn").onclick = () => start(state.deck, true);
  $("talkBack").onclick = () => { renderDecks(); show("talk-decks"); };
  $("talkEndBack").onclick = () => { renderDecks(); show("talk-decks"); };
  document.addEventListener("keydown", (e) => {
    if (!$("talk-play").classList.contains("active") || e.target === wrap || !$("modal").hidden) return;
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  renderPlayers();
  return { renderDecks };
})();
