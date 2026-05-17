/* ============================================================
   badVIno — visit card
   ============================================================ */

/* ---------- projects ---------- */
const PROJECTS = [
  {
    tag: "игра · онлайн",
    title: "Шутер от Viora Studio",
    desc: "Браузерный шутер. Два типа оружия. Возможность играть по сети или с ботами.",
    url: "https://game-t4at.onrender.com/",
    chips: ["онлайн", "WebGL", "только ПК"],
    mock: "shooter",
  },
  {
    tag: "магазин · визитка",
    title: "Магазин iPhone",
    desc: "Сайт-визитка магазина смартфонов. Каталог, карточки товара, мобильная вёрстка.",
    url: "https://iphones-573t.onrender.com/",
    chips: ["каталог", "адаптив"],
    mock: "shop",
  },
  {
    tag: "сервис · ии",
    title: "Онлайн-школа с ИИ",
    desc: "Демо платформы обучения со встроенной нейросетью для подготовки к ЕГЭ.",
    url: "https://shweb-ten.vercel.app/",
    chips: ["AI", "auth", "demo"],
    mock: "school",
  },
  {
    tag: "игра · ии",
    title: "Шахматы с ИИ",
    desc: "Три уровня сложности, обучение с нуля, подсказки, виды 45°/60°, сохранение партии. Мобильная версия.",
    url: "https://badvino-ctrl.github.io/chess/",
    chips: ["AI", "engine", "адаптив"],
    mock: "chess",
  },
  {
    tag: "игра · ии",
    title: "Шашки с ИИ",
    desc: "Простые шашки со встроенным искусственным интеллектом — собранным с нуля.",
    url: "https://badvino-ctrl.github.io/online-heckers/",
    chips: ["AI", "адаптив"],
    mock: "checkers",
  },
  {
    tag: "образование",
    title: "Изучение мозга",
    desc: "Сайт об устройстве человеческого мозга. Ранняя версия — допиливается.",
    url: "https://badvino-ctrl.github.io/brain/",
    chips: ["wip", "адаптив"],
    mock: "brain",
  },
  {
    tag: "тест · ии",
    title: "ИИ-тест личности",
    desc: "Сможет ли нейросеть определить твой тип личности по ответам? Эксперимент.",
    url: "https://badvino-ctrl.github.io/testv/",
    chips: ["AI", "тест"],
    mock: "test",
  },
  {
    tag: "сервис · ии",
    title: "Калькулятор жизни",
    desc: "Перевод стоимости покупок в часы вашей жизни. Viora AI достаёт актуальные цены.",
    url: "https://badvino-ctrl.github.io/Viora-in-hours/",
    chips: ["AI", "Viora AI", "адаптив"],
    mock: "hours",
  },
  {
    tag: "визитка · пример",
    title: "Urban Brew — кофейня",
    desc: "Сайт-визитка кофейни. Делался как пример работы по этому направлению: меню, атмосфера, контакты.",
    url: "https://badvino-ctrl.github.io/Urban-Brew/",
    chips: ["визитка", "адаптив", "меню"],
    mock: "coffee",
  },
];

/* ---------- mock backgrounds (shown if iframe blocked) ---------- */
const MOCKS = {
  shooter:  `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">
    <defs><linearGradient id="m1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1a1410"/><stop offset="1" stop-color="#0a0606"/></linearGradient></defs>
    <rect width="400" height="250" fill="url(#m1)"/>
    <circle cx="200" cy="130" r="2" fill="#d11d2c"/>
    <line x1="190" y1="130" x2="210" y2="130" stroke="#d11d2c" stroke-width="1"/>
    <line x1="200" y1="120" x2="200" y2="140" stroke="#d11d2c" stroke-width="1"/>
    <text x="20" y="30" fill="#444" font-family="monospace" font-size="9">HP 100  AMMO 24/120</text>
    <text x="20" y="230" fill="#666" font-family="monospace" font-size="9">VIORA · SHOOTER</text>
  </svg>`,
  shop: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#0e0e10"/>
    <rect x="20" y="20" width="110" height="140" rx="8" fill="#16161a"/>
    <rect x="140" y="20" width="110" height="140" rx="8" fill="#16161a"/>
    <rect x="260" y="20" width="110" height="140" rx="8" fill="#16161a"/>
    <text x="20" y="180" fill="#8a8a8a" font-family="monospace" font-size="10">iPhone 15 Pro · 99 990 ₽</text>
  </svg>`,
  school: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#08090c"/>
    <circle cx="80" cy="125" r="40" fill="none" stroke="#d11d2c" stroke-width="1.5"/>
    <circle cx="80" cy="125" r="22" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>
    <text x="140" y="115" fill="#fff" font-family="monospace" font-size="14">SHWEB · AI</text>
    <text x="140" y="135" fill="#888" font-family="monospace" font-size="10">обучение нового поколения</text>
  </svg>`,
  chess: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#0a0a0a"/>
    <g transform="translate(120,30)">
      ${Array.from({length:8}).map((_,r)=>Array.from({length:8}).map((_,c)=>`<rect x="${c*22}" y="${r*22}" width="22" height="22" fill="${(r+c)%2?'#1a1a1a':'#2a2a2a'}"/>`).join("")).join("")}
    </g>
    <text x="20" y="240" fill="#666" font-family="monospace" font-size="10">VIORA · CHESS · AI</text>
  </svg>`,
  checkers: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#0a0a0a"/>
    <g transform="translate(140,25)">
      ${Array.from({length:8}).map((_,r)=>Array.from({length:8}).map((_,c)=>`<rect x="${c*15}" y="${r*15}" width="15" height="15" fill="${(r+c)%2?'#171717':'#232323'}"/>`).join("")).join("")}
      <circle cx="22" cy="22" r="5" fill="#d11d2c"/>
      <circle cx="98" cy="98" r="5" fill="#eee"/>
    </g>
  </svg>`,
  brain: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#08080a"/>
    <g stroke="#d11d2c" stroke-width="1" fill="none" opacity=".7">
      <path d="M120 130 Q160 80 200 130 T280 130"/>
      <path d="M120 130 Q160 180 200 130 T280 130"/>
      <circle cx="200" cy="130" r="40"/>
    </g>
    <text x="20" y="30" fill="#666" font-family="monospace" font-size="10">/ neuro / map</text>
  </svg>`,
  test: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#0b0b0d"/>
    <rect x="40" y="80" width="320" height="14" rx="7" fill="#1a1a1a"/>
    <rect x="40" y="80" width="180" height="14" rx="7" fill="#d11d2c"/>
    <text x="40" y="60" fill="#aaa" font-family="monospace" font-size="11">вопрос 7 / 12</text>
    <text x="40" y="130" fill="#666" font-family="monospace" font-size="10">ИИ анализирует ответы…</text>
  </svg>`,
  coffee: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <defs><linearGradient id="cf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1b120a"/><stop offset="1" stop-color="#0a0706"/></linearGradient></defs>
    <rect width="400" height="250" fill="url(#cf)"/>
    <g transform="translate(170,70)">
      <rect x="0" y="20" width="60" height="80" rx="4" fill="#2a1d12" stroke="#6b4a2a" stroke-width="1.5"/>
      <path d="M60 35 Q85 35 85 60 Q85 85 60 85" fill="none" stroke="#6b4a2a" stroke-width="1.5"/>
      <ellipse cx="30" cy="22" rx="28" ry="4" fill="#3a2515"/>
      <path d="M16 8 Q20 0 18 -6" stroke="#8a6a4a" stroke-width="1.5" fill="none" opacity=".6"/>
      <path d="M30 6 Q34 -2 32 -8" stroke="#8a6a4a" stroke-width="1.5" fill="none" opacity=".6"/>
      <path d="M44 8 Q48 0 46 -6" stroke="#8a6a4a" stroke-width="1.5" fill="none" opacity=".6"/>
    </g>
    <text x="20" y="30" fill="#8a6a4a" font-family="monospace" font-size="10">URBAN BREW</text>
    <text x="20" y="230" fill="#555" font-family="monospace" font-size="9">coffee · since 2024</text>
  </svg>`,
  hours: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#08080a"/>
    <text x="40" y="90" fill="#fff" font-family="monospace" font-size="36" font-weight="bold">160 ч.</text>
    <text x="40" y="120" fill="#8a8a8a" font-family="monospace" font-size="11">= 1× iPhone 15</text>
    <line x1="40" y1="150" x2="360" y2="150" stroke="#222" stroke-width="1"/>
    <text x="40" y="180" fill="#d11d2c" font-family="monospace" font-size="10">VIORA · HOURS</text>
  </svg>`,
};

/* ---------- render cards ---------- */
function hostFromUrl(u){ try{ return new URL(u).host.replace(/^www\./,""); }catch{ return ""; } }

function renderCards(){
  const root = document.getElementById("cards");
  root.innerHTML = PROJECTS.map((p, i) => `
    <article class="card reveal" data-href="${p.url}" data-i="${i}" style="transition-delay:${(i%4)*60}ms">
      <div class="card-preview">
        <div class="browser-bar">
          <span class="dot-r"></span><span class="dot-y"></span><span class="dot-g"></span>
          <span class="browser-url">${hostFromUrl(p.url)}</span>
        </div>
        <div class="preview-mock">${MOCKS[p.mock] || ""}</div>
        <iframe class="preview-frame" loading="lazy" referrerpolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin"
                src="${p.url}" tabindex="-1" aria-hidden="true"></iframe>
        <div class="card-overlay">
          <span class="open-pill">открыть <span>↗</span></span>
        </div>
      </div>
      <div class="card-body">
        <span class="card-tag">${p.tag}</span>
        <h3 class="card-title">${p.title}</h3>
        <p class="card-desc">${p.desc}</p>
        <div class="card-meta">
          ${p.chips.map(c => `<span class="chip${c==="только ПК"||c==="wip"?" warn":""}">${c}</span>`).join("")}
        </div>
      </div>
    </article>
  `).join("");

  // click → open
  root.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const url = card.dataset.href;
      window.open(url, "_blank", "noopener");
    });
  });
}

/* ---------- smooth scroll for [data-action="scroll"] ---------- */
function bindScroll(){
  document.querySelectorAll('[data-action="scroll"]').forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(el.dataset.target);
      if (target) target.scrollIntoView({behavior:"smooth", block:"start"});
    });
  });
}

/* ---------- order buttons → telegram dm with prefilled text ---------- */
function bindOrders(){
  document.querySelectorAll('[data-action="order"]').forEach(b => {
    b.addEventListener("click", () => {
      const svc = b.dataset.service || "";
      const text = encodeURIComponent(`Здравствуйте! Интересует: ${svc}.`);
      window.open(`https://t.me/badVInq?text=${text}`, "_blank", "noopener");
    });
  });
}

/* ---------- contacts: click to reveal + open ---------- */
function bindContacts(){
  document.querySelectorAll(".contact-row").forEach(row => {
    const valEl = row.querySelector("[data-val]");
    let revealed = false;
    row.addEventListener("click", () => {
      if (!revealed) {
        valEl.textContent = row.dataset.copy;
        valEl.classList.add("is-revealed");
        revealed = true;
        toast("ссылка открыта");
        setTimeout(() => window.open(row.dataset.href, "_blank", "noopener"), 250);
      } else {
        window.open(row.dataset.href, "_blank", "noopener");
      }
    });
  });
}

/* ---------- toast ---------- */
let toastT;
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("show"), 1800);
}

/* ---------- reveal on scroll ---------- */
function bindReveal(){
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, {threshold:.12});
  els.forEach(e => io.observe(e));
}

/* ---------- animated background canvas (dot grid + drifting accent) ---------- */
function startBg(){
  const c = document.getElementById("bg");
  const ctx = c.getContext("2d");
  let w, h, dpr, dots = [];
  const SPACING = 44;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.width = innerWidth * dpr;
    h = c.height = innerHeight * dpr;
    c.style.width = innerWidth+"px";
    c.style.height = innerHeight+"px";
    buildDots();
  }
  function buildDots(){
    dots = [];
    const sp = SPACING * dpr;
    for (let y = sp/2; y < h; y += sp){
      for (let x = sp/2; x < w; x += sp){
        dots.push({x, y, p: Math.random()*Math.PI*2});
      }
    }
  }
  let mx = -9999, my = -9999;
  addEventListener("mousemove", e => { mx = e.clientX*dpr; my = e.clientY*dpr; });
  addEventListener("mouseleave", () => { mx = my = -9999; });

  let t = 0;
  function tick(){
    t += 0.006;
    ctx.clearRect(0,0,w,h);

    // drifting accent glow
    const gx = w * (0.5 + Math.cos(t*0.4)*0.3);
    const gy = h * (0.5 + Math.sin(t*0.3)*0.3);
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 360*dpr);
    grad.addColorStop(0, "rgba(209,29,44,0.10)");
    grad.addColorStop(1, "rgba(209,29,44,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);

    // dots
    for (const d of dots){
      const dx = d.x - mx, dy = d.y - my;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const near = Math.max(0, 1 - dist/(180*dpr));
      const tw = 0.35 + Math.sin(t*1.2 + d.p)*0.15;
      const a = Math.min(1, tw + near*0.9);
      const r = (1.1 + near*1.6) * dpr;
      if (near > 0.15){
        ctx.fillStyle = `rgba(209,29,44,${a*0.9})`;
      } else {
        ctx.fillStyle = `rgba(200,200,200,${a*0.22})`;
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  resize();
  addEventListener("resize", resize);
  tick();
}

/* ---------- intro ---------- */
function handleIntro(){
  const intro = document.getElementById("intro");
  if (!intro) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches){
    intro.remove();
    document.body.classList.remove("intro-active");
    return;
  }
  // sync with css animation: 1.55s delay + 0.5s anim = 2.05s
  setTimeout(() => {
    document.body.classList.remove("intro-active");
  }, 1550);
  setTimeout(() => {
    intro.remove();
  }, 2100);
  // allow skip on click / key
  const skip = () => {
    intro.style.animation = "introOut .25s forwards";
    document.body.classList.remove("intro-active");
    setTimeout(() => intro.remove(), 280);
  };
  intro.addEventListener("click", skip, {once:true});
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" || e.key === "Enter") skip();
  }, {once:true});
}

/* ---------- year ---------- */
document.getElementById("yr").textContent = new Date().getFullYear();

/* ---------- init ---------- */
handleIntro();
renderCards();
bindScroll();
bindOrders();
bindContacts();
bindReveal();
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) startBg();
