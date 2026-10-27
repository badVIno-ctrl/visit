/* VIORA STUDIO · интерактив визитки. Без зависимостей, всё лениво и только по делу. */
(() => {
  'use strict';
  const d = document, html = d.documentElement;
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));
  const hasIO = 'IntersectionObserver' in window;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const TG = 'https://t.me/badVInq';
  const FX_KEY = 'vioraFx';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* приватный режим */ } }
  };

  /* Режим эффектов: полный или лёгкий */
  const fxBtn = $('#fx-toggle');
  const isLite = () => html.classList.contains('lite');
  function syncFx() {
    if (!fxBtn) return;
    const full = !isLite();
    fxBtn.setAttribute('aria-pressed', String(full));
    const label = $('.fx-toggle__label', fxBtn);
    if (label) label.textContent = full ? 'Эффекты: полные' : 'Эффекты: лёгкие';
  }
  function setLite(on, remember) {
    html.classList.toggle('lite', on);
    if (remember) store.set(FX_KEY, on ? 'lite' : 'full');
    syncFx();
  }
  if (fxBtn) fxBtn.addEventListener('click', () => setLite(!isLite(), true));
  syncFx();

  /* Проба кадров: если устройство не тянет эффекты, тихо включаем лёгкий режим */
  function probeFps() {
    if (store.get(FX_KEY) || isLite() || d.hidden) return;
    const deltas = [];
    let last = 0;
    const tick = (t) => {
      if (last) deltas.push(t - last);
      last = t;
      if (deltas.length < 48) { requestAnimationFrame(tick); return; }
      deltas.sort((a, b) => a - b);
      const median = deltas[Math.floor(deltas.length / 2)];
      if (median > 26) setLite(true, false);
    };
    requestAnimationFrame(tick);
  }
  addEventListener('load', () => setTimeout(probeFps, 1200), { once: true });

  /* Шрифты готовы: запускаем глитч и удар печати */
  const ready = () => html.classList.add('fx-ready');
  if (d.fonts && d.fonts.ready) {
    Promise.race([d.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(ready);
  } else ready();

  /* Ссылки в Telegram с готовым текстом */
  $$('a[data-tg]').forEach((a) => { a.href = TG + '?text=' + encodeURIComponent(a.dataset.tg); });

  /* Анимации вне экрана ставим на паузу */
  if (hasIO) {
    const pause = new IntersectionObserver((entries) => {
      for (const e of entries) {
        e.target.classList.toggle('is-off', !e.isIntersecting);
        if (e.target.classList.contains('hero')) html.classList.toggle('hero-on', e.isIntersecting);
      }
    }, { rootMargin: '120px 0px' });
    $$('[data-anim]').forEach((el) => pause.observe(el));
  } else html.classList.add('hero-on');

  /* Появление секций: один раз, без повторов */
  const revealAll = (els) => els.forEach((el) => el.classList.add('is-in'));
  let revealer = null;
  if (hasIO) {
    revealer = new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    $$('[data-reveal], .tape').forEach((el) => revealer.observe(el));
  } else revealAll($$('[data-reveal], .tape'));

  /* Навигация: мобильное меню и текущий раздел */
  const burger = $('.nav__burger');
  const menu = $('#menu');
  let menuOpen = false;
  let closeTimer = 0;
  function focusables() {
    return $$('.nav a, .nav button').filter((el) => el.offsetParent !== null || el === burger);
  }
  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    clearTimeout(closeTimer);
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    html.classList.add('menu-open');
  }
  function closeMenu(returnFocus) {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    html.classList.remove('menu-open');
    closeTimer = setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 320);
    if (returnFocus) burger.focus();
  }
  if (burger && menu) {
    burger.addEventListener('click', () => (menuOpen ? closeMenu(false) : openMenu()));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(false); });
    d.addEventListener('keydown', (e) => {
      if (!menuOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); return; }
      if (e.key !== 'Tab') return;
      const list = focusables();
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    const desk = matchMedia('(min-width: 1024px)');
    const onDesk = (e) => { if (e.matches) closeMenu(false); };
    desk.addEventListener ? desk.addEventListener('change', onDesk) : desk.addListener(onDesk);
  }

  const navLinks = $$('.nav__links a, .menu__links a');
  function setCurrent(id) {
    navLinks.forEach((a) => {
      if (id && a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  if (hasIO) {
    const ids = new Set(navLinks.map((a) => a.getAttribute('href').slice(1)));
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        setCurrent(ids.has(e.target.id) ? e.target.id : null);
      }
    }, { rootMargin: '-45% 0px -54% 0px' });
    $$('main > section').forEach((s) => spy.observe(s));
  }

  /* Экранное меню кассеты: таймкод и дата */
  const tc = $('[data-timecode]');
  const vd = $('[data-vhsdate]');
  if (vd) {
    const n = new Date();
    const p2 = (x) => String(x).padStart(2, '0');
    vd.textContent = 'SP ' + p2(n.getDate()) + '.' + p2(n.getMonth() + 1) + '.' + n.getFullYear();
  }
  if (tc) {
    const t0 = Date.now();
    const p2 = (x) => String(x).padStart(2, '0');
    setInterval(() => {
      if (!html.classList.contains('hero-on') || d.hidden) return;
      const s = Math.floor((Date.now() - t0) / 1000);
      tc.textContent = p2(Math.floor(s / 3600)) + ':' + p2(Math.floor(s / 60) % 60) + ':' + p2(s % 60);
    }, 1000);
  }

  /* Главная мысль: слова загораются по одному при прокрутке */
  const tagline = $('[data-words]');
  if (tagline) {
    const words = [];
    const split = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = d.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(part)); return; }
            const s = d.createElement('span');
            s.className = 'tw';
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) split(child);
      });
    };
    split(tagline);
    let lit = 0, queued = false;
    const paint = () => {
      queued = false;
      const r = tagline.getBoundingClientRect();
      const vh = innerHeight;
      const start = vh * 0.85, end = vh * 0.4;
      const p = (start - r.top) / (start - end + r.height * 0.6);
      const n = Math.round(Math.min(1, Math.max(0, p)) * words.length);
      if (n <= lit) return;
      for (let i = lit; i < n; i++) words[i].classList.add('is-on');
      lit = n;
      if (lit >= words.length) removeEventListener('scroll', onScroll);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    if (hasIO) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && lit < words.length) { addEventListener('scroll', onScroll, { passive: true }); paint(); }
        else removeEventListener('scroll', onScroll);
      }).observe(tagline);
    } else words.forEach((w) => w.classList.add('is-on'));
  }

  /* Архив работ: фильтр по категориям и «показать ещё» */
  const grid = $('#works-grid');
  if (grid) {
    const cards = $$('.work', grid);
    const chips = $$('.filters .chip');
    const moreWrap = $('.works__more');
    const moreBtn = $('#works-more');
    const status = $('#works-status');
    const initial = Number(grid.dataset.initial) || 7;
    const cats = new Set(chips.map((c) => c.dataset.cat));
    let cat = 'all', expanded = false;
    const q = new URLSearchParams(location.search).get('cat');
    if (q && cats.has(q)) cat = q;
    const vt = typeof d.startViewTransition === 'function';
    if (vt) cards.forEach((c, i) => { c.style.viewTransitionName = 'work-' + i; });

    const apply = (animate, focusFrom) => {
      const run = () => {
        let shown = 0;
        cards.forEach((card, i) => {
          const match = cat === 'all' ? (expanded || i < initial) : card.dataset.cat === cat;
          if (match && card.hidden && animate) card.classList.add('is-in');
          card.hidden = !match;
          if (match) shown++;
        });
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === cat)));
        if (moreWrap) moreWrap.hidden = !(cat === 'all' && !expanded && cards.length > initial);
        if (status) {
          const label = cat === 'all' ? 'все категории' : ($('.chip[data-cat="' + cat + '"] .chip__label') || {}).textContent;
          status.textContent = 'Показано ' + shown + ' из ' + (cat === 'all' ? cards.length : shown) + ', ' + label;
        }
      };
      if (animate && vt && !isLite() && !reduce.matches) d.startViewTransition(run);
      else run();
      if (focusFrom != null) {
        const target = cards[focusFrom] && $('.work__link', cards[focusFrom]);
        if (target) setTimeout(() => target.focus({ preventScroll: false }), 60);
      }
    };
    chips.forEach((chip) => chip.addEventListener('click', () => {
      if (chip.dataset.cat === cat) return;
      cat = chip.dataset.cat;
      const url = new URL(location.href);
      if (cat === 'all') url.searchParams.delete('cat'); else url.searchParams.set('cat', cat);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      apply(true);
    }));
    if (moreBtn) moreBtn.addEventListener('click', () => { expanded = true; apply(true, initial); });
    apply(false);
  }

  /* YouTube: обложка вместо плеера, плеер грузим только по клику */
  let warmed = false;
  const warm = () => {
    if (warmed) return;
    warmed = true;
    ['https://www.youtube-nocookie.com', 'https://www.google.com', 'https://i.ytimg.com'].forEach((u) => {
      const l = d.createElement('link');
      l.rel = 'preconnect';
      l.href = u;
      d.head.appendChild(l);
    });
  };
  let playing = null;
  function stopVideo() {
    if (!playing) return;
    playing.wrap.replaceWith(playing.link);
    playing = null;
  }
  function playVideo(link, start) {
    stopVideo();
    warm();
    const id = link.dataset.yt;
    const wrap = d.createElement('div');
    wrap.className = link.className + ' is-playing is-loading';
    const frame = d.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&playsinline=1&rel=0' + (start ? '&start=' + Math.floor(start) : '');
    frame.title = link.dataset.title || 'Видео на YouTube';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.addEventListener('load', () => wrap.classList.remove('is-loading'), { once: true });
    wrap.appendChild(frame);
    link.replaceWith(wrap);
    playing = { link, wrap, id };
    frame.focus();
  }
  d.addEventListener('pointerover', (e) => { if (e.target.closest && e.target.closest('.yt')) warm(); }, { passive: true });
  d.addEventListener('focusin', (e) => { if (e.target.closest && e.target.closest('.yt')) warm(); });
  d.addEventListener('click', (e) => {
    const link = e.target.closest && e.target.closest('a.yt[data-yt]');
    if (link) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      playVideo(link, 0);
      return;
    }
    const ch = e.target.closest && e.target.closest('.chapter[data-t]');
    if (ch) {
      const id = ch.dataset.for;
      const t = Number(ch.dataset.t) || 0;
      const box = d.querySelector('a.yt[data-yt="' + CSS.escape(id) + '"]') || (playing && playing.id === id ? playing.link : null);
      if (!box) return;
      playVideo(box, t);
      const r = playing.wrap.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) playing.wrap.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
    }
  });

  /* Копирование команд установки */
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    const src = d.getElementById(btn.dataset.copy);
    const out = $('.code__status', btn.parentElement);
    if (!src || !out) return;
    const text = Array.from(src.childNodes)
      .filter((n) => !(n.nodeType === 1 && n.classList.contains('code__p')))
      .map((n) => n.textContent).join('').trim();
    try {
      await navigator.clipboard.writeText(text);
      out.classList.remove('is-error');
      out.textContent = 'Команды скопированы. Запусти их в папке проекта.';
    } catch (err) {
      out.classList.add('is-error');
      out.textContent = 'Не получилось скопировать. Выдели команды и нажми Ctrl+C.';
    }
  }));

  /* Бриф: проверяем поле и собираем сообщение в Telegram */
  const form = $('#brief');
  if (form) {
    const task = $('#task'), field = $('#f-task'), err = $('#task-err'), ok = $('#brief-ok');
    const check = () => {
      const bad = task.value.trim().length < 10;
      field.classList.toggle('is-invalid', bad);
      err.hidden = !bad;
      task.setAttribute('aria-invalid', String(bad));
      return !bad;
    };
    task.addEventListener('input', () => { if (field.classList.contains('is-invalid')) check(); });
    task.addEventListener('blur', () => { if (task.value.trim()) check(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!check()) { task.focus(); return; }
      const type = (form.querySelector('input[name="type"]:checked') || {}).value || 'Проект';
      const name = $('#name').value.trim();
      const msg = 'Привет, Влад' + (name ? '. Меня зовут ' + name : '') + '.\nФормат: ' + type + '.\nЗадача: ' + task.value.trim() + '\n\nХочу узнать цену и срок.';
      const url = TG + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank', 'noopener');
      ok.textContent = 'Сообщение собрано, открываю Telegram. Если чат не открылся, ';
      const a = d.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'открой его вручную';
      ok.appendChild(a);
      ok.appendChild(d.createTextNode('.'));
      ok.hidden = false;
    });
  }

  /* Относительное время: «2 часа назад» */
  const rtf = 'RelativeTimeFormat' in Intl ? new Intl.RelativeTimeFormat('ru', { numeric: 'auto' }) : null;
  const ago = (date) => {
    if (!rtf || isNaN(date)) return null;
    const s = (date.getTime() - Date.now()) / 1000;
    const a = Math.abs(s);
    if (s > 0 || a < 60) return 'только что';
    if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
    if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
    if (a < 86400 * 7) return rtf.format(Math.round(s / 86400), 'day');
    return null;
  };
  $$('time[data-rel]').forEach((t) => {
    const r = ago(new Date(t.getAttribute('datetime')));
    if (r) { t.title = t.textContent; t.textContent = r; }
  });
  $$('time[data-ago]').forEach((t) => {
    const r = ago(new Date(t.getAttribute('datetime')));
    if (r) { t.title = t.textContent; t.textContent = r; }
  });
})();
