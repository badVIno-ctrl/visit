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
  {
    tag: "доставка · каталог",
    title: "ЖАРА",
    desc: "Сервис доставки еды с каталогом блюд, фильтрами по категориям, корзиной и таймером доставки. Всё горячее, всё быстро.",
    url: "https://badvino-ctrl.github.io/dost/",
    chips: ["доставка", "корзина", "каталог"],
    mock: "dost",
  },
  {
    tag: "ремонт · сметы",
    title: "СметаПро",
    desc: "Конструктор смет для ремонта квартир и домов: комнаты, работы, материалы, автоитоги, PDF и ссылка для подрядчика.",
    url: "https://badvino-ctrl.github.io/smetaonline/",
    chips: ["PDF", "калькулятор", "ссылка"],
    mock: "smeta",
  },
  {
    tag: "город · интерактив",
    title: "Сканер города",
    desc: "Интерактивный сканер города для поиска скрытых мест, заброшек и интересных точек.",
    url: "https://badvino-ctrl.github.io/intr/",
    chips: ["карта", "сканер", "точки"],
    mock: "intr",
  },
  {
    tag: "сервис · ии",
    title: "Viora AI",
    desc: "ИИ-помощник от Viora Studio для быстрых идей, текста и рабочих задач в одном аккуратном интерфейсе.",
    url: "https://badvino-ctrl.github.io/vioraAI/",
    chips: ["AI", "Viora Studio", "ассистент"],
    mock: "viora",
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
  dost: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <defs><linearGradient id="ds" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#251007"/><stop offset="1" stop-color="#090909"/></linearGradient></defs>
    <rect width="400" height="250" fill="url(#ds)"/>
    <circle cx="92" cy="120" r="48" fill="#d11d2c" opacity=".9"/>
    <circle cx="92" cy="120" r="32" fill="#ffb84d" opacity=".75"/>
    <rect x="170" y="58" width="150" height="22" rx="11" fill="#241411"/>
    <rect x="170" y="96" width="190" height="14" rx="7" fill="#372018"/>
    <rect x="170" y="122" width="150" height="14" rx="7" fill="#2a1915"/>
    <text x="28" y="220" fill="#ffb84d" font-family="monospace" font-size="12">ЖАРА · delivery</text>
  </svg>`,
  smeta: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#08100f"/>
    <rect x="34" y="42" width="130" height="150" rx="8" fill="#11201d" stroke="#45d8bd" stroke-width="1" opacity=".85"/>
    <rect x="190" y="42" width="176" height="22" rx="5" fill="#17302b"/>
    <rect x="190" y="78" width="142" height="16" rx="4" fill="#24433d"/>
    <rect x="190" y="108" width="160" height="16" rx="4" fill="#24433d"/>
    <rect x="190" y="152" width="176" height="34" rx="7" fill="#45d8bd" opacity=".8"/>
    <text x="56" y="82" fill="#dff" font-family="monospace" font-size="11">room 01</text>
    <text x="214" y="174" fill="#06100e" font-family="monospace" font-size="13" font-weight="bold">PDF · TOTAL</text>
  </svg>`,
  intr: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="400" height="250" fill="#07090d"/>
    <g stroke="#3f6dff" stroke-width="1" opacity=".28">
      <path d="M0 68H400M0 128H400M0 188H400M70 0V250M160 0V250M250 0V250M340 0V250"/>
    </g>
    <circle cx="206" cy="126" r="64" fill="none" stroke="#6bf0ff" stroke-width="1.5" opacity=".75"/>
    <circle cx="206" cy="126" r="28" fill="none" stroke="#d11d2c" stroke-width="1.5"/>
    <circle cx="266" cy="82" r="5" fill="#d11d2c"/>
    <circle cx="146" cy="168" r="4" fill="#6bf0ff"/>
    <text x="28" y="220" fill="#6bf0ff" font-family="monospace" font-size="11">hidden city scanner</text>
  </svg>`,
  viora: `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <defs><radialGradient id="va" cx=".5" cy=".45" r=".65"><stop offset="0" stop-color="#d11d2c" stop-opacity=".55"/><stop offset="1" stop-color="#08080a"/></radialGradient></defs>
    <rect width="400" height="250" fill="url(#va)"/>
    <circle cx="200" cy="118" r="54" fill="none" stroke="#fff" stroke-width="1" opacity=".36"/>
    <circle cx="200" cy="118" r="18" fill="#fff" opacity=".9"/>
    <path d="M120 172 C160 142 240 142 280 172" fill="none" stroke="#ff6b78" stroke-width="2" opacity=".85"/>
    <text x="126" y="214" fill="#fff" font-family="monospace" font-size="12">VIORA AI · studio</text>
  </svg>`,
};

/* ---------- render cards ---------- */
function hostFromUrl(u){ try{ return new URL(u).host.replace(/^www\./,""); }catch{ return ""; } }

function renderCards(){
  const root = document.getElementById("cards");
  const colors = [
    "142, 249, 252", "142, 252, 204", "252, 142, 142", "252, 208, 142",
    "215, 252, 142", "252, 142, 239", "204, 142, 252", "142, 202, 252",
    "255, 184, 77", "69, 216, 189", "107, 240, 255", "255, 107, 120",
    "255, 255, 170",
  ];
  root.innerHTML = `
    <div class="inner" data-carousel-inner style="--quantity:${PROJECTS.length};">
      ${PROJECTS.map((p, i) => `
        <article class="card project-card" data-project-card data-href="${p.url}" data-i="${i}" data-angle="${(360 / PROJECTS.length) * i}"
          style="--index:${i};--card-angle:${(360 / PROJECTS.length) * i}deg;--color-card:${colors[i % colors.length]};">
          <div class="card-depth-overlay"></div>
          <div class="img">
            <div class="card-preview">
              <div class="browser-bar">
                <span class="dot-r"></span><span class="dot-y"></span><span class="dot-g"></span>
                <span class="browser-url">${hostFromUrl(p.url)}</span>
              </div>
              <div class="preview-mock">${MOCKS[p.mock] || ""}</div>
              <iframe class="preview-frame" loading="lazy" referrerpolicy="no-referrer"
                      sandbox="allow-scripts allow-same-origin"
                      data-src="${p.url}" tabindex="-1" aria-hidden="true"></iframe>
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
          </div>
        </article>
      `).join("")}
    </div>
    <div class="carousel-hint">правой кнопкой мыши или пальцем — вращать</div>
  `;
  root.style.setProperty("--quantity", PROJECTS.length);

  // click → open
  root.querySelectorAll("[data-project-card]").forEach(card => {
    card.addEventListener("click", () => {
      if (root.dataset.dragging === "true") return;
      const url = card.dataset.href;
      window.open(url, "_blank", "noopener");
    });
  });
}

function bindProjectCarousel(){
  const root = document.getElementById("cards");
  if (!root) return;
  const inner = root.querySelector("[data-carousel-inner]");
  if (!inner) return;
  const cards = [...root.querySelectorAll("[data-project-card]")];

  let angle = 0;
  let targetAngle = 0;
  const idleSpeed = 0.008;
  let velocity = idleSpeed;
  let dragging = false;
  let hoveringCard = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastMoveT = performance.now();
  let moved = 0;
  let lastT = performance.now();
  let lastPreviewT = 0;
  let isMaybeDragging = false;
  let hasDecidedDrag = false;
  let isPointerCaptured = false;
  let carouselVisible = false;
  let animationFrameId = null;
  let activeFrameTimeout = null;

  function setAngle(next){
    angle = next;
    inner.style.setProperty("--angle", `${angle}deg`);
    updateCardDepth();
  }

  function signedAngle(value){
    return ((value + 540) % 360) - 180;
  }

  function updateCardDepth() {
    for (const card of cards) {
      const cardAngle = Number(card.dataset.angle) || 0;
      const distanceFromFront = Math.abs(signedAngle(angle + cardAngle));
      const normDistance = distanceFromFront / 180; // 0 to 1
      
      card.style.setProperty("--norm-distance", normDistance.toFixed(3));
      
      const isFront = distanceFromFront < 18;
      card.classList.toggle("is-front", isFront);
    }
  }

  function updateLivePreviews(){
    if (!carouselVisible) return;
    
    const isRotatingRapidly = Math.abs(velocity) > 0.05 || dragging;

    // If active rotation or dragging is in progress, suspend new loads for maximum smoothness
    if (isRotatingRapidly) {
      if (activeFrameTimeout) {
        clearTimeout(activeFrameTimeout);
        activeFrameTimeout = null;
      }
      return;
    }

    // A load is already scheduled/in progress, let it finish!
    if (activeFrameTimeout) {
      return;
    }

    // Get visible cards in the front half (distanceFromFront < 85 degrees)
    const visibleCards = cards.filter(card => {
      const cardAngle = Number(card.dataset.angle) || 0;
      const distanceFromFront = Math.abs(signedAngle(angle + cardAngle));
      return distanceFromFront < 85;
    });

    // Sort by proximity to front center (closest first)
    visibleCards.sort((a, b) => {
      const distA = Math.abs(signedAngle(angle + (Number(a.dataset.angle) || 0)));
      const distB = Math.abs(signedAngle(angle + (Number(b.dataset.angle) || 0)));
      return distA - distB;
    });

    // Find the first visible card that is not yet loaded
    const nextToLoad = visibleCards.find(card => {
      const frame = card.querySelector(".preview-frame");
      return frame && !frame.getAttribute("src");
    });

    // Make sure loaded frames are visually active (have class is-live-preview)
    for (const card of cards) {
      const frame = card.querySelector(".preview-frame");
      const hasSrc = frame && frame.getAttribute("src");
      card.classList.toggle("is-live-preview", !!hasSrc);
    }

    // Load one card's iframe, then schedule the next one sequentially
    if (nextToLoad) {
      const frame = nextToLoad.querySelector(".preview-frame");
      if (frame) {
        activeFrameTimeout = setTimeout(() => {
          activeFrameTimeout = null; // Clear immediately so subsequent calls can schedule next loads
          if (carouselVisible && !dragging && Math.abs(velocity) < 0.05) {
            frame.setAttribute("src", frame.dataset.src);
            nextToLoad.classList.add("is-live-preview");
            
            // Queue the next visible unloaded card after a gentle delay
            setTimeout(updateLivePreviews, 400);
          }
        }, 150);
      }
    }
  }

  function tick(now){
    if (!carouselVisible) {
      animationFrameId = null;
      return;
    }
    const dt = Math.min(32, now - lastT);
    lastT = now;
    if (document.hidden) {
      animationFrameId = requestAnimationFrame(tick);
      return;
    }
    if (dragging) {
      const diff = targetAngle - angle;
      setAngle(angle + diff * 0.28);
    } else {
      const targetSpeed = hoveringCard ? idleSpeed * 0.2 : idleSpeed;
      velocity += (targetSpeed - velocity) * 0.014;
      setAngle(angle + velocity * dt);
      targetAngle = angle;
    }
    if (now - lastPreviewT > 140) {
      lastPreviewT = now;
      updateLivePreviews();
    }
    animationFrameId = requestAnimationFrame(tick);
  }

  root.addEventListener("contextmenu", e => e.preventDefault());
  root.addEventListener("pointerenter", e => {
    if (e.pointerType === "mouse") hoveringCard = true;
  });
  root.addEventListener("pointerleave", () => {
    hoveringCard = false;
  });
  root.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 2) return;
    isMaybeDragging = true;
    hasDecidedDrag = false;
    startX = lastX = e.clientX;
    startY = e.clientY;
    lastMoveT = performance.now();
    moved = 0;
    targetAngle = angle;
  });

  root.addEventListener("pointermove", e => {
    if (!isMaybeDragging) return;
    
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - startY;
    const totalDx = e.clientX - startX;

    if (!hasDecidedDrag) {
      const absX = Math.abs(totalDx);
      const absY = Math.abs(dy);
      
      if (absX > 8 || absY > 8) {
        if (absX > absY) {
          dragging = true;
          hasDecidedDrag = true;
          root.dataset.dragging = "false";
          root.classList.add("is-dragging");
          try {
            root.setPointerCapture(e.pointerId);
            isPointerCaptured = true;
          } catch (err) {}
        } else {
          isMaybeDragging = false;
          dragging = false;
          hasDecidedDrag = true;
          return;
        }
      } else {
        return;
      }
    }

    if (!dragging) return;

    const dt = Math.max(16, now - lastMoveT);
    moved += Math.abs(dx);
    lastX = e.clientX;
    lastMoveT = now;
    velocity = (dx / dt) * 0.12;
    targetAngle += dx * 0.34;
    if (Math.abs(e.clientX - startX) > 5) root.dataset.dragging = "true";
  });

  function stopDrag(e){
    isMaybeDragging = false;
    if (!dragging) return;
    dragging = false;
    root.classList.remove("is-dragging");
    if (moved <= 5) root.dataset.dragging = "false";
    else setTimeout(() => { root.dataset.dragging = "false"; }, 140);
    if (isPointerCaptured) {
      try {
        root.releasePointerCapture(e.pointerId);
      } catch {}
      isPointerCaptured = false;
    }
  }

  root.addEventListener("pointerup", stopDrag);
  root.addEventListener("pointercancel", stopDrag);
  root.addEventListener("wheel", e => {
    if (!e.shiftKey && Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    e.preventDefault();
    const wheelDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    velocity += wheelDelta * 0.00035;
  }, {passive:false});

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        carouselVisible = entry.isIntersecting;
        if (carouselVisible) {
          lastT = performance.now();
          if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(tick);
          }
          updateLivePreviews();
        }
      });
    }, { rootMargin: "200px 0px 200px 0px" });
    observer.observe(root);
  } else {
    carouselVisible = true;
  }

  setAngle(0);
  if (!("IntersectionObserver" in window)) {
    animationFrameId = requestAnimationFrame(tick);
  }
}

/* ---------- keep first load on the hero, not restored section/hash ---------- */
function resetInitialScroll(){
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) history.replaceState(null, "", location.href.split("#")[0]);
  window.scrollTo({top:0, left:0, behavior:"auto"});
  window.addEventListener("load", () => {
    window.scrollTo({top:0, left:0, behavior:"auto"});
  }, {once:true});
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

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({behavior:"smooth", block:"start"});
      history.replaceState(null, "", location.href.split("#")[0]);
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
resetInitialScroll();
handleIntro();
renderCards();
bindProjectCarousel();
bindScroll();
bindOrders();
bindContacts();
bindReveal();
