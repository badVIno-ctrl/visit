#!/usr/bin/env node
/*
 * VIORA STUDIO · сборщик визитки.
 *
 * Берёт data/works.json и data/config.json, тянет свежие данные из YouTube и Telegram
 * и пересобирает блоки между маркерами <!-- @имя --> … <!-- /@имя --> в index.html.
 * Повторный запуск безопасен: маркеры остаются на месте, меняется только содержимое.
 *
 *   node scripts/update.mjs                   полная сборка с сетью
 *   node scripts/update.mjs --offline         без сети, из data/feed.json (удобно для правок вёрстки)
 *   node scripts/update.mjs --refresh-images  заново скачать все обложки
 *
 * Переменные окружения:
 *   YT_API_KEY     необязательно. Точные длительности и счётчики через YouTube Data API v3.
 *   ALLOW_STALE=1  если источник не ответил, берём прошлые данные из data/feed.json.
 *                  Без него в GitHub Actions сборка пропускает деплой, и на сайте остаётся прошлая версия.
 */
import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import { existsSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { /* без sharp просто не трогаем картинки */ }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(ROOT, ...a);
const ARGS = new Set(process.argv.slice(2));
const OFFLINE = ARGS.has('--offline');
const REFRESH = ARGS.has('--refresh-images');
const ALLOW_STALE = OFFLINE || /^(1|true|yes)$/i.test(process.env.ALLOW_STALE || '');
const API_KEY = (process.env.YT_API_KEY || '').trim();
const CI = Boolean(process.env.GITHUB_ACTIONS);
const NOW = new Date();
const DAY = 86400000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const YT_COOKIE = 'SOCS=CAI; CONSENT=YES+1; PREF=hl=ru&gl=RU';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('·', ...a);
const warn = (m) => console.warn(CI ? `::warning::${m}` : `! ${m}`);
const output = (k, v) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };
const readJSON = async (f, fb = null) => { try { return JSON.parse(await readFile(f, 'utf8')); } catch { return fb; } };

/* ───────────── сеть ───────────── */

async function get(url, { type = 'text', headers = {}, timeout = 20000, retries = 2, noRetry = [] } = {}) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, 'accept-language': 'ru-RU,ru;q=0.9,en;q=0.5', ...headers },
        redirect: 'follow',
        signal: ctrl.signal
      });
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status} ${url.split('?')[0]}`);
        err.status = res.status;
        if (noRetry.includes(res.status)) err.final = true;
        throw err;
      }
      const body = type === 'buffer' ? Buffer.from(await res.arrayBuffer()) : type === 'json' ? await res.json() : await res.text();
      return { res, body };
    } catch (err) {
      last = err.name === 'AbortError' ? new Error(`таймаут ${url.split('?')[0]}`) : err;
      if (err.final || attempt === retries) break;
      await sleep(1500 * (attempt + 1) ** 2);
    } finally {
      clearTimeout(timer);
    }
  }
  throw last;
}

/* ───────────── текст ───────────── */

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', laquo: '«', raquo: '»', mdash: '—', ndash: '–', hellip: '…' };
const decode = (s = '') => String(s).replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') {
    const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : m;
  }
  return ENT[e.toLowerCase()] ?? m;
});
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const stripTags = (h = '') => h.replace(/<[^>]+>/g, '');
const squash = (s = '') => s.replace(/[ \t\u00a0]+/g, ' ').trim();
const pad2 = (n) => String(n).padStart(2, '0');

const EMOJI = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u{1F3FB}-\u{1F3FF}])(?:[\uFE0F\u20E3]|\u200D(?:\p{Extended_Pictographic}|\p{Regional_Indicator}))*|[\uFE0F\u20E3\u200D\u2060\uFEFF]/gu;
const TAG = /#[\p{L}\p{N}_]+/gu;
const letters = (s) => (s.match(/\p{L}/gu) || []).length;

/* Правило дизайна: никаких дефисов и тире в тексте. Переписываем аккуратно. */
function dehyphen(s) {
  return s
    .replace(/(^|\n)[ \t]*[-–—•◆▪●►]+[ \t]+/g, '$1')
    .replace(/\s+[-–—]+\s+(?=это\s)/gi, ' ')
    .replace(/(\d)\s*[-–—]\s*(?=\d)/g, '$1…')
    .replace(/\s+[-–—]+\s+/g, ': ')
    .replace(/\s+[–—]+(?=\S)|(?<=\S)[–—]+\s+/g, ': ')
    .replace(/(?<=[\p{L}\p{N}])[-‐‑–—](?=[\p{L}\p{N}])/gu, ' ')
    .replace(/[-‐‑–—]+/g, ' ')
    .replace(/:\s*:/g, ':')
    .replace(/[ \t]{2,}/g, ' ');
}

const KEEP = new Set(['ИИ', 'GPT', 'SOL', 'AI', 'API', 'PWA', 'ЕГЭ', 'ОГЭ', 'РКН', 'HR', 'CSS', 'HTML', 'UI', 'UX', 'SEO', 'SDK', 'CLI', 'MCP', 'FPS',
  'PDF', 'ZIP', 'ТЗ', 'IT', 'ПК', 'СВД', 'АК', 'МСК', 'VIORA', 'STUDIO', 'RTX', 'GPU', 'CPU', 'VPN', 'ВПН', 'BPM', 'QR', 'NPC', 'ООО', 'ИП', 'США', 'РФ', 'JSON', 'PRO', 'TTS']);
const CASE = { OPUS: 'Opus', CLAUDE: 'Claude', NOTION: 'Notion', CHATGPT: 'ChatGPT', GEMINI: 'Gemini', CURSOR: 'Cursor', CODEX: 'Codex', FABLE: 'Fable',
  DEEPSEEK: 'DeepSeek', YOUTUBE: 'YouTube', TELEGRAM: 'Telegram', GITHUB: 'GitHub', STEAM: 'Steam', NOTEBOOKLM: 'NotebookLM', ANTIGRAVITY: 'Antigravity',
  MIDJOURNEY: 'Midjourney', WINDOWS: 'Windows', ANDROID: 'Android', IPHONE: 'iPhone', SONNET: 'Sonnet', GROK: 'Grok', SORA: 'Sora', VEO: 'Veo' };
function smartCase(s) {
  return s.replace(/[\p{L}\p{N}]+/gu, (w) => {
    if (/\p{N}/u.test(w)) return w;
    if (w.toLowerCase() === 'рф') return 'РФ';
    const up = w.toUpperCase();
    if (w !== up || w === w.toLowerCase()) return w;
    if (KEEP.has(w)) return w;
    if (CASE[w]) return CASE[w];
    if (/^[A-Z]{2,3}$/.test(w)) return w;
    return w.toLowerCase();
  });
}
const capFirst = (s) => s.replace(/^([^\p{L}\p{N}]*)(\p{Ll})/u, (m, a, b) => a + b.toUpperCase());
const capSentences = (s) => capFirst(s).replace(/([.!?]\s+)(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase());
const quotes = (s) => s.replace(/"([^"\n]+)"/g, '«$1»').replace(/"/g, '');
/* Смайлики из скобок «))» и одинокие скобки: оставляем только парные. */
function parens(s) {
  let open = 0;
  const out = [];
  for (const c of s) {
    if (c === '(') { open++; out.push(c); }
    else if (c === ')') { if (open) { open--; out.push(c); } }
    else out.push(c);
  }
  let t = out.join('');
  while (open-- > 0) { const i = t.lastIndexOf('('); t = t.slice(0, i) + t.slice(i + 1); }
  return t;
}
/* Строки абзаца склеиваем по смыслу: после знака препинания пробел, иначе запятая. */
const joinLines = (lines) => lines.map((l) => l.trim().replace(/^[-–—•◆▪●►]+\s+/, '')).filter(Boolean)
  .reduce((acc, l) => (acc ? acc + (/[.!?…:;,]$/.test(acc) ? ' ' : ', ') + l : l), '');

/* Финальная полировка любой строки, которая попадёт на страницу. */
function polish(s, { casing = true, cap = true } = {}) {
  let t = s.replace(/https?:\/\/\S+/g, ' ').replace(/(^|\s)@[\w.]+/g, '$1');
  t = parens(t.replace(/\.{3,}/g, '…').replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?')).replace(/\(\s*\)/g, '');
  t = dehyphen(quotes(t));
  if (casing) t = smartCase(t);
  t = squash(t.replace(/\s+([,.!?:;…])/g, '$1').replace(/([,:;])(?=\p{L})/gu, '$1 '));
  t = t.replace(/^[\s,.:;!?…|]+/, '').replace(/[\s,:;|]+$/, '');
  return cap ? capSentences(t) : t;
}

function cut(s, n) {
  if (s.length <= n) return s;
  const head = s.slice(0, n + 1);
  const end = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '), head.lastIndexOf('… '));
  if (end > n * 0.45) return head.slice(0, end + 1).trim();
  const sp = head.lastIndexOf(' ', n - 1);
  return head.slice(0, sp > 0 ? sp : n - 1).replace(/[\s,.:;!?]+$/, '') + '…';
}

/* Заголовки роликов: убираем хэштеги, эмодзи и капс, оставляем смысл. */
function tidyTitle(raw, desc = '', deep = true) {
  let t = decode(raw).replace(/\s+/g, ' ');
  t = t.replace(/#([\p{L}\p{N}_]+?)(?=#)/gu, '#$1 ').replace(/#([A-Za-z0-9_]+)(?=[А-ЯЁа-яё])/g, '#$1 ');
  t = t.replace(/^\s*shorts\b[\s:|]*/i, '');
  const lead = t.match(/^\s*((?:#[\p{L}\p{N}_]+\s*)+)/u);
  if (lead) {
    const rest = t.slice(lead[0].length);
    const tags = lead[1].trim().split(/\s+/);
    t = (/^\p{Ll}/u.test(rest) ? tags[tags.length - 1].slice(1) + ' ' : '') + rest;
  }
  t = t.replace(TAG, ' ').replace(/\bshorts\b/gi, ' ');
  t = t.replace(new RegExp(`(?:${EMOJI.source})+`, 'gu'), (m, off, str) => {
    const after = str.slice(off + m.length).replace(EMOJI, '').trim();
    const words = after.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
    return words >= 2 ? '. ' : ' ';
  });
  t = t.replace(/([.!?…:])\s*\.\s/g, '$1 ').replace(/\s+\./g, '.');
  t = polish(t);
  if (letters(t) < 4 && deep) {
    const line = decode(desc).split('\n').map((l) => l.replace(TAG, '').trim()).find((l) => letters(l) >= 4 && !/https?:/.test(l));
    if (line) t = tidyTitle(line, '', false);
  }
  return cut(t, 110);
}

const CHAPTER = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s*[-–—:|]?\s*(.+)$/;
const toSec = (ts) => ts.split(':').reduce((a, x) => a * 60 + Number(x), 0);

function summarize(desc, max = 260) {
  const paras = decode(desc).replace(/\r/g, '').split(/\n\s*\n/);
  for (const p of paras) {
    const lines = p.split('\n').map((l) => l.trim()).filter((l) => l
      && !/^(#[\p{L}\p{N}_]+\s*)+$/u.test(l)
      && !/^(таймкоды|тайм коды|timecodes|chapters|содержание)\s*:?$/i.test(l)
      && !/https?:\/\//.test(l)
      && !CHAPTER.test(l));
    const txt = lines.join(' ').replace(TAG, ' ');
    if (letters(txt) > 20) return cut(polish(txt.replace(EMOJI, ' '), { casing: false }), max);
  }
  return '';
}

function chaptersOf(desc) {
  const list = [];
  for (const line of decode(desc).replace(/\r/g, '').split('\n')) {
    const m = line.trim().match(CHAPTER);
    if (m) list.push({ t: toSec(m[1]), label: cut(polish(m[2].replace(EMOJI, ' '), { casing: false }), 80) });
  }
  return list.length >= 3 && list[0].t === 0 ? list : [];
}

/* ───────────── форматирование ───────────── */

const TZ = 'Europe/Moscow';
const plural = (n, [one, few, many]) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  return b === 1 ? one : many;
};
const VIEWS = ['просмотр', 'просмотра', 'просмотров'];
const SUBS = ['подписчик', 'подписчика', 'подписчиков'];
const num = (n) => new Intl.NumberFormat('ru-RU').format(n).replace(/[\u202f\u00a0\s]/g, '\u00a0');
const compact = (n) => (n < 10000 ? num(n) : new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(n).replace(/[\u202f\u00a0\s]/g, '\u00a0'));
const dtf = (o) => new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, ...o });
const ymd = (d) => dtf({ year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).reduce((a, p) => ({ ...a, [p.type]: p.value }), {});
const isoDay = (d) => { const p = ymd(d); return `${p.year}-${p.month}-${p.day}`; };
function fmtDay(d) {
  d = new Date(d);
  const same = ymd(d).year === ymd(NOW).year;
  return dtf(same ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s*г\.$/, '');
}
const fmtStamp = (d) => `${fmtDay(d)}, ${dtf({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(d))}`;
function fmtDur(s) {
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h}:${pad2(m)}:${pad2(x)}` : `${m}:${pad2(x)}`;
}
function durWords(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.round(s % 60);
  return [h && `${h} ч`, m && `${m} мин`, !h && x && `${x} сек`].filter(Boolean).join(' ');
}
const isoDur = (s) => `PT${Math.floor(s / 3600) ? Math.floor(s / 3600) + 'H' : ''}${Math.floor((s % 3600) / 60)}M${Math.round(s % 60)}S`;
const parseIsoDur = (iso = '') => {
  const m = /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/.exec(iso);
  return m ? (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : 0;
};
const ageDays = (iso) => Math.max(0, (NOW - new Date(iso)) / DAY);
function parseCount(s = '') {
  const t = String(s).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.').toLowerCase();
  const m = t.match(/^([\d.]+)(k|m|тыс\.?|млн)?/);
  if (!m) return null;
  const mult = !m[2] ? 1 : /^(k|тыс)/.test(m[2]) ? 1e3 : 1e6;
  return Math.round(parseFloat(m[1]) * mult);
}

/* ───────────── картинки ───────────── */

async function toWebp(buf, outBase, widths, { ratio = null, position = 'centre', quality = 72 } = {}) {
  if (!sharp) return null;
  const meta = await sharp(buf).metadata();
  await mkdir(path.dirname(outBase), { recursive: true });
  for (const w of widths) {
    const opts = ratio ? { width: w, height: Math.round(w / ratio), fit: 'cover', position } : { width: w, withoutEnlargement: true };
    await sharp(buf).resize(opts).webp({ quality, effort: 5 }).toFile(`${outBase}-${w}.webp`);
  }
  return meta;
}

async function firstImage(urls) {
  for (const url of urls) {
    try {
      const { body } = await get(url, { type: 'buffer', retries: 1, noRetry: [404], timeout: 15000 });
      if (body.length > 3000) return body;
    } catch { /* пробуем следующий вариант */ }
  }
  return null;
}

/* ───────────── YouTube ───────────── */

function parseFeed(xml) {
  return xml.split('<entry>').slice(1).map((e) => {
    const g = (re) => { const m = e.match(re); return m ? decode(m[1]) : ''; };
    return {
      id: g(/<yt:videoId>([^<]+)<\/yt:videoId>/),
      title: g(/<title>([^<]*)<\/title>/),
      published: g(/<published>([^<]+)<\/published>/),
      description: g(/<media:description>([\s\S]*?)<\/media:description>/),
      views: Number(g(/<media:statistics views="(\d+)"/)) || 0,
      likes: Number(g(/<media:starRating count="(\d+)"/)) || 0
    };
  }).filter((v) => v.id);
}

function extractJSON(html, name) {
  const at = html.search(new RegExp(`${name}\\s*=\\s*\\{`));
  if (at < 0) return null;
  const start = html.indexOf('{', at);
  let depth = 0, str = false, escd = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (str) { if (escd) escd = false; else if (c === '\\') escd = true; else if (c === '"') str = false; continue; }
    if (c === '"') str = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; } }
  }
  return null;
}

async function watchDetails(id) {
  const { body } = await get(`https://www.youtube.com/watch?v=${id}&hl=ru&gl=RU`, { headers: { cookie: YT_COOKIE }, retries: 1, timeout: 20000 });
  const j = extractJSON(body, 'ytInitialPlayerResponse');
  const vd = j?.videoDetails, mf = j?.microformat?.playerMicroformatRenderer;
  const len = vd?.lengthSeconds || (body.match(/"lengthSeconds":"(\d+)"/) || [])[1];
  if (!len) throw new Error(`нет данных ролика ${id}`);
  return {
    duration: Number(len) || 0,
    views: Number(vd?.viewCount) || 0,
    title: vd?.title || '',
    description: vd?.shortDescription || '',
    published: mf?.publishDate || mf?.uploadDate || ''
  };
}

async function apiVideos(ids) {
  const out = new Map();
  if (!API_KEY || !ids.length) return out;
  const { body } = await get(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids.join(',')}&key=${API_KEY}`, { type: 'json', retries: 1 });
  for (const it of body.items || []) {
    out.set(it.id, {
      duration: parseIsoDur(it.contentDetails?.duration),
      views: Number(it.statistics?.viewCount) || 0,
      likes: Number(it.statistics?.likeCount) || 0,
      title: it.snippet?.title || '',
      description: it.snippet?.description || '',
      published: it.snippet?.publishedAt || ''
    });
  }
  return out;
}

/* Вкладка «Видео» канала: счётчики, аватар и длительности без ключа API (страница ролика с серверов просит вход). */
async function channelStats(yc) {
  if (API_KEY) {
    try {
      const { body } = await get(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${yc.channelId}&key=${API_KEY}`, { type: 'json', retries: 1 });
      const it = body.items?.[0];
      if (it) return { name: it.snippet?.title, subs: Number(it.statistics?.subscriberCount), videos: Number(it.statistics?.videoCount), avatarUrl: it.snippet?.thumbnails?.high?.url, durations: {} };
    } catch (e) { warn(`YouTube API канала: ${e.message}`); }
  }
  const { body } = await get(`https://www.youtube.com/channel/${yc.channelId}/videos?hl=ru&gl=RU`, { headers: { cookie: YT_COOKIE }, retries: 2 });
  const durations = {};
  for (const m of body.matchAll(/"thumbnailBadgeViewModel":\{"text":"((?:\d+:)?\d{1,2}:\d{2})"[^{}]*?"animationActivationTargetId":"([\w-]{11})"/g)) durations[m[2]] ??= toSec(m[1]);
  for (const m of body.matchAll(/"videoId":"([\w-]{11})"[\s\S]{0,3000}?"lengthText":\{[^}]*?"simpleText":"((?:\d+:)?\d{1,2}:\d{2})"/g)) durations[m[1]] ??= toSec(m[2]);
  const subs = body.match(/"content":"([\d\s\u00a0,.]+(?:\s?(?:тыс\.|млн|K|M))?)\s*(?:подписчик|subscriber)/i);
  const vids = body.match(/"content":"([\d\s\u00a0,.]+(?:\s?(?:тыс\.|млн|K|M))?)\s*(?:видео|videos?)"/i);
  const ava = body.match(/<meta property="og:image" content="([^"]+)"/);
  const name = body.match(/<meta property="og:title" content="([^"]+)"/);
  return { name: name ? decode(name[1]) : '', subs: subs ? parseCount(subs[1]) : null, videos: vids ? parseCount(vids[1]) : null, avatarUrl: ava ? decode(ava[1]) : '', durations };
}

async function fetchYouTube(cfg, prev) {
  const yc = cfg.youtube;
  const base = yc.channelId.replace(/^UC/, '');
  const feed = async (kind) => parseFeed((await get(`https://www.youtube.com/feeds/videos.xml?playlist_id=${kind}${base}`, { retries: 3 })).body);
  const [longR, shortR, popR, chanR] = await Promise.allSettled([feed('UULF'), feed('UUSH'), feed('UUPS'), channelStats(yc)]);
  if (longR.status === 'rejected') throw new Error(`лента роликов: ${longR.reason.message}`);
  if (shortR.status === 'rejected' && popR.status === 'rejected') throw new Error(`лента шортсов: ${shortR.reason.message}`);
  const hide = new Set(yc.hide || []);
  const prevAll = new Map([...(prev?.fresh || []), ...(prev?.trending || [])].map((v) => [v.id, v]));

  const fresh = longR.value.filter((v) => !hide.has(v.id) && new Date(v.published) <= NOW)
    .sort((a, b) => new Date(b.published) - new Date(a.published)).slice(0, yc.fresh?.count ?? 2);

  const pool = new Map();
  for (const r of [shortR, popR]) for (const v of r.value || []) if (!pool.has(v.id)) pool.set(v.id, v);
  const today = isoDay(NOW);
  const tc = yc.trending || {};
  const pins = (tc.pins || []).filter((p) => p.id && (!p.until || p.until >= today) && !hide.has(p.id)).map((p) => p.id);
  const gravity = tc.gravity ?? 1;
  const ranked = [...pool.values()].filter((v) => !hide.has(v.id) && !pins.includes(v.id))
    .map((v) => ({ ...v, score: v.views / (ageDays(v.published) + 2) ** gravity }))
    .sort((a, b) => b.score - a.score);
  const count = tc.count ?? 5;
  const trending = [...pins.map((id) => pool.get(id) || { id, missing: true }), ...ranked].slice(0, count)
    .map((v) => ({ ...v, pinned: pins.includes(v.id) }));

  // Длительности и недостающие данные: вкладка канала, API, страница ролика, прошлый запуск.
  const known = chanR.status === 'fulfilled' ? chanR.value.durations || {} : {};
  for (const v of fresh) if (known[v.id]) v.duration = known[v.id];
  const need = [...fresh.filter((v) => !v.duration), ...trending.filter((v) => v.missing)];
  let api = new Map();
  try { api = await apiVideos(need.map((v) => v.id)); } catch (e) { warn(`YouTube API: ${e.message}`); }
  for (const v of need) {
    let d = api.get(v.id);
    if (!d) { try { d = await watchDetails(v.id); } catch (e) { warn(`YouTube ${v.id}: ${e.message}`); } }
    const old = prevAll.get(v.id);
    if (d) {
      v.duration = d.duration || old?.duration || 0;
      if (d.views > (v.views || 0)) v.views = d.views;
      if (v.missing) Object.assign(v, { title: d.title, description: d.description, published: d.published, missing: false });
    } else if (old) {
      v.duration = old.duration || 0;
      if (v.missing) Object.assign(v, { ...old, missing: false });
    }
  }
  const clean = ({ score, missing, ...v }) => v;
  let channel = chanR.status === 'fulfilled' ? (({ durations, ...c }) => c)(chanR.value) : null;
  if (chanR.status === 'rejected') warn(`YouTube канал: ${chanR.reason.message}`);
  if (channel && prev?.channel) {
    channel.subs ??= prev.channel.subs;
    channel.videos ??= prev.channel.videos;
    channel.name ||= prev.channel.name;
  }
  if (!channel) channel = prev?.channel || null;
  return { fetchedAt: NOW.toISOString(), channel, fresh: fresh.map(clean), trending: trending.filter((v) => !v.missing && v.published).map(clean) };
}

async function youtubeImages(yt) {
  const dir = P('assets/img/yt');
  for (const v of yt.fresh) {
    const out = path.join(dir, v.id);
    if (!REFRESH && existsSync(`${out}-640.webp`) && existsSync(`${out}-1280.webp`)) continue;
    const buf = await firstImage(['maxresdefault', 'hq720', 'sddefault', 'hqdefault'].map((n) => `https://i.ytimg.com/vi/${v.id}/${n}.jpg`));
    if (buf) await toWebp(buf, out, [640, 1280], { ratio: 16 / 9 }); else warn(`нет обложки ${v.id}`);
  }
  for (const v of yt.trending) {
    const out = path.join(dir, v.id);
    if (!REFRESH && existsSync(`${out}-270.webp`) && existsSync(`${out}-540.webp`)) continue;
    const buf = await firstImage([`https://i.ytimg.com/vi/${v.id}/oar2.jpg`, `https://i.ytimg.com/vi/${v.id}/hq720.jpg`, `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`]);
    if (buf) await toWebp(buf, out, [270, 540], { ratio: 9 / 16 }); else warn(`нет обложки шортса ${v.id}`);
  }
  const ava = yt.channel?.avatarUrl;
  if (ava && sharp) {
    const buf = await firstImage([ava.replace(/=s\d+/, '=s240'), ava]);
    if (buf) for (const s of [96, 192]) await sharp(buf).resize(s, s, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(dir, `avatar-${s}.webp`));
  }
}

/* ───────────── Telegram ───────────── */

function innerDiv(html, start) {
  let depth = 0;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(html))) {
    if (m[0] === '</div>') { if (--depth === 0) return html.slice(html.indexOf('>', start) + 1, m.index); }
    else depth++;
  }
  return '';
}
const htmlText = (h) => decode(stripTags(h.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|blockquote|div)>/gi, '\n'))).replace(/\u00a0/g, ' ');

function parseTgChannel(page) {
  const counters = {};
  for (const m of page.matchAll(/<span class="counter_value">([^<]+)<\/span>\s*<span class="counter_type">([^<]+)<\/span>/g)) counters[m[2].trim()] = parseCount(m[1]);
  const di = page.indexOf('<div class="tgme_channel_info_description">');
  const desc = di >= 0 ? htmlText(innerDiv(page, di)) : '';
  const tagline = desc.split(/\n+/).map((l) => l.trim()).find((l) => /[•·|]/.test(l) && letters(l) > 4) || '';
  return { subs: counters.subscribers ?? counters.subscriber ?? null, tagline: tagline.replace(/\s*[•|]\s*/g, ' · ') };
}

function parseTgPosts(page, ch) {
  const out = [];
  for (const part of page.split('<div class="tgme_widget_message_wrap').slice(1)) {
    const idm = part.match(new RegExp(`data-post="${ch}/(\\d+)"`, 'i'));
    if (!idm || /service_message/.test(part.slice(0, 400))) continue;
    const ti = part.indexOf('<div class="tgme_widget_message_text js-message_text"');
    const raw = ti >= 0 ? htmlText(innerDiv(part, ti)) : '';
    const photo = part.match(/tgme_widget_message_(?:photo_wrap|video_thumb)[^>]*background-image:url\('([^']+)'\)/);
    const ratio = part.match(/class="tgme_widget_message_photo"[^>]*padding-top:([\d.]+)%/);
    const pv = part.match(/<a class="tgme_widget_message_link_preview" href="([^"]+)">([\s\S]*?)<\/a>/);
    const pvField = (cls) => { const m = pv && pv[2].match(new RegExp(`class="${cls}[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`)); return m ? squash(htmlText(m[1])) : ''; };
    const doc = part.match(/tgme_widget_message_document_title[^>]*>([^<]*)<\/div>\s*<div class="tgme_widget_message_document_extra[^>]*>([^<]*)</);
    const reactions = [...part.matchAll(/<span class="tgme_reaction[^"]*">([\s\S]*?)<\/span>/g)].map((m) => {
      const e = (m[1].match(/<b>([^<]+)<\/b>/) || [])[1];
      const n = parseCount(stripTags(m[1]).replace(e || '', '').trim());
      return e && n ? { e: decode(e), n } : null;
    }).filter(Boolean);
    out.push({
      id: Number(idm[1]),
      date: (part.match(/<time datetime="([^"]+)"/) || [])[1] || '',
      views: parseCount((part.match(/<span class="tgme_widget_message_views">([^<]+)</) || [])[1]) || 0,
      raw,
      tags: [...new Set((raw.match(TAG) || []).map((t) => t.toLowerCase()))],
      reactions,
      photo: photo ? { url: photo[1], ratio: ratio ? Number(ratio[1]) / 100 : null, video: /video_thumb/.test(photo[0]) } : null,
      preview: pv ? { url: decode(pv[1]), site: pvField('link_preview_site_name'), title: pvField('link_preview_title'), desc: pvField('link_preview_description') } : null,
      doc: doc ? { name: decode(doc[1]).trim(), size: decode(doc[2]).trim() } : null
    });
  }
  return out;
}

async function fetchTelegram(cfg, prev) {
  const tc = cfg.telegram;
  const ch = tc.channel;
  const { body: page } = await get(`https://t.me/s/${ch}`, { retries: 3 });
  if (!page.includes('tgme_channel_info')) throw new Error('t.me вернул неожиданную страницу');
  const channel = parseTgChannel(page);
  const posts = new Map(parseTgPosts(page, ch).map((p) => [p.id, p]));
  if (!posts.size) throw new Error('на странице канала нет постов');
  const featured = (tc.featured || []).map(Number);
  const fallback = (id) => {
    const old = prev?.posts?.find((p) => p.id === id);
    if (old) posts.set(id, old); else featured.splice(featured.indexOf(id), 1);
  };
  for (let guard = 0; guard < 6; guard++) {
    const miss = featured.filter((id) => !posts.has(id)).sort((a, b) => b - a)[0];
    if (!miss) break;
    try {
      const { body } = await get(`https://t.me/s/${ch}?before=${miss + 1}`, { retries: 2 });
      parseTgPosts(body, ch).forEach((p) => { if (!posts.has(p.id)) posts.set(p.id, p); });
      if (!posts.has(miss)) { warn(`Telegram: пост ${miss} не найден, возможно удалён`); fallback(miss); }
    } catch (e) {
      warn(`Telegram ${miss}: ${e.message}`);
      fallback(miss);
    }
  }
  const tag = (tc.autoTag || '').toLowerCase();
  const latest = [...posts.values()].filter((p) => !featured.includes(p.id)).sort((a, b) => b.id - a.id);
  const auto = (tag && latest.find((p) => p.tags.includes(tag) && letters(p.raw) > 20)) || latest.find((p) => letters(p.raw) > 40);
  const chosen = [...(auto ? [{ ...auto, role: 'auto' }] : []), ...featured.map((id) => posts.get(id)).filter(Boolean).map((p) => ({ ...p, role: 'featured' }))];
  for (const p of chosen) {
    const old = prev?.posts?.find((x) => x.id === p.id);
    if (p.photo && old?.photo?.widths) { p.photo.widths = old.photo.widths; p.photo.ratio = old.photo.ratio || p.photo.ratio; }
  }
  if (channel.subs == null && prev?.channel) channel.subs = prev.channel.subs;
  return { fetchedAt: NOW.toISOString(), channel, posts: chosen };
}

async function telegramImages(tg) {
  for (const p of tg.posts) {
    if (!p.photo?.url) continue;
    const base = P('assets/img/tg', `post-${p.id}`);
    const have = p.photo.widths?.length && p.photo.widths.every((w) => existsSync(`${base}-${w}.webp`));
    if (have && !REFRESH) continue;
    const buf = sharp ? await firstImage([p.photo.url]) : null;
    if (!buf) {
      if (!existsSync(`${base}-480.webp`)) { warn(`Telegram: не скачалась картинка поста ${p.id}`); p.photo = null; }
      else p.photo.widths ||= [480];
      continue;
    }
    const meta = await sharp(buf).metadata();
    const widths = [...new Set([480, Math.min(960, meta.width)])].sort((a, b) => a - b);
    await toWebp(buf, base, widths, { quality: 74 });
    p.photo.widths = widths;
    p.photo.ratio = meta.height / meta.width;
  }
}

const GREET = /^(хай|привет|всем привет|салют|йоу|гайзы|ребят|ребята|друзья|здарова|доброе утро|добрый день|добрый вечер)(?=[\s,!.]|$)/i;

function excerpt(raw) {
  let lines = raw.replace(/\r/g, '').split('\n').map((l) => l.trim());
  const sig = lines.findIndex((l) => /^(ЧАТ|CHAT)\s*\|/i.test(l) || /\|\s*(ТГК|TELEGRAM)\s*$/i.test(l));
  if (sig >= 0) lines = lines.slice(0, sig);
  lines = lines.map((l) => (/^(#[\p{L}\p{N}_]+\s*)+$/u.test(l) || /^смотреть\s*:?$/i.test(l) || /^https?:\/\/\S+$/.test(l) ? '' : l));
  const paras = lines.join('\n').split(/\n{2,}/).map((p) => p.trim()).filter((p) => letters(p) >= 3);
  if (paras.length > 1 && GREET.test(paras[0]) && paras[0].length < 140) paras.shift();
  if (paras.length > 1 && paras[0].length < 25 && !/^\d{1,2}[.)]\s/.test(paras[1])) {
    if (/(\.\.\.|…)$/.test(paras[0]) || !/\s/.test(paras[0])) paras.shift();
    else paras.splice(0, 2, `${paras[0]} ${paras[1]}`);
  }
  const fix = (s) => polish(s.replace(TAG, ' ').replace(EMOJI, ' '));
  const fl = (paras[0] || '').split('\n');
  const numbered = fl.findIndex((l) => /^\d{1,2}[.)]\s/.test(l));
  let head = numbered > 0 ? fl.slice(0, numbered) : fl;
  let tail = numbered > 0 ? fl.slice(numbered) : [];
  if (joinLines(head).length > 120) { tail = [...head.slice(1), ...tail]; head = head.slice(0, 1); }
  const title = joinLines(head);
  const rest = [tail.join('\n'), ...paras.slice(1)].filter((p) => p.trim());
  const list = [];
  for (const l of (rest[0] || '').split('\n')) {
    const m = l.match(/^\d{1,2}[.)]\s+(.+)/);
    if (m) list.push(cut(fix(m[1]), 120));
    else if (list.length) break;
  }
  const body = rest.find((p) => !/^\d{1,2}[.)]\s/.test(p));
  return { title: cut(fix(title), 130), text: body ? cut(fix(joinLines(body.split('\n'))), 220) : '', list: list.slice(0, 3) };
}

/* ───────────── вёрстка блоков ───────────── */

const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const rel = (iso) => `<time datetime="${esc(iso)}" data-rel>${esc(fmtDay(iso))}</time>`;
const has = (src) => existsSync(P(src));

function renderFilters(w) {
  const chips = [{ id: 'all', label: 'Все', n: w.items.length }, ...w.categories.map((c) => ({ id: c.id, label: c.label, n: w.items.filter((x) => x.cat === c.id).length }))].filter((c) => c.n);
  return chips.map((c) => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${c.id === 'all'}" aria-controls="works-grid"><span class="chip__label">${esc(c.label)}</span> <span class="mono">${c.n}</span></button>`).join('\n');
}

const WORK_SIZES = '(min-width:1280px) 384px, (min-width:1024px) calc((100vw - 112px) / 3), (min-width:640px) calc((100vw - 72px) / 2), calc(100vw - 42px)';

function termLines(it) {
  return (it.term || []).map((l, i) => {
    const [a, b = ''] = l;
    if (a === '$' || a === 'ok') return `<p style="--i:${i}"><span class="c-p">${a}</span><span>${esc(b)}</span></p>`;
    return `<p style="--i:${i}"><span class="c-pkg">${esc(a)}</span><span class="c-dim">${esc(b)}</span></p>`;
  }).join('');
}

function renderWorks(w) {
  const cats = new Map(w.categories.map((c) => [c.id, c.label]));
  const initial = w.initial ?? 7;
  let k = 0;
  return w.items.map((it, i) => {
    const hidden = i >= initial ? ' hidden' : '';
    const internal = String(it.url || '').startsWith('#');
    const target = internal ? '' : ' target="_blank" rel="noopener"';
    const code = it.repo ? `<a class="work__code" href="${esc(it.repo)}" target="_blank" rel="noopener" aria-label="Код проекта ${esc(it.title)} на GitHub">${icon('github-logo')}Код</a>` : '';
    const tags = it.tags?.length ? `<ul class="tags" aria-label="Стек">${it.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
    const go = `<span class="work__go" aria-hidden="true">${esc(it.go || 'Открыть')}${icon(internal ? 'arrow-right' : 'arrow-up-right')}</span>`;
    const cat = esc(cats.get(it.cat) || '');
    if (it.featured) {
      return `<article class="work work--featured" data-cat="${it.cat}" data-reveal${hidden}>
<div class="work__media work__media--term" aria-hidden="true"><div class="term mono"><p class="term__bar"><span class="term__dots"><i></i><i></i><i></i></span><span>${esc(it.termTitle || '~/' + it.slug)}</span></p><div class="term__body">${termLines(it)}</div></div></div>
<div class="work__body"><p class="work__cat">${cat}${it.badge ? ` · ${esc(it.badge)}` : ''}</p><h3 class="work__title"><a class="work__link" href="${esc(it.url)}"${target}>${esc(it.title)}</a></h3><p class="work__desc">${esc(it.desc)}</p>${tags}<div class="work__foot">${go}${code}</div></div>
</article>`;
    }
    const d = k++ % 3;
    const src = `assets/img/work/${it.image}`;
    const media = has(`${src}-480.webp`)
      ? `<img src="${src}-480.webp" srcset="${src}-480.webp 480w, ${src}-800.webp 800w" sizes="${WORK_SIZES}" width="800" height="500" alt="${esc(it.alt || it.title)}" loading="lazy" decoding="async">`
      : '';
    const wake = it.sleepy ? `<p class="work__wake">${icon('clock')}Бесплатный сервер: первый запуск до минуты</p>` : '';
    return `<article class="work" data-cat="${it.cat}" data-reveal style="--d:${d}"${hidden}>
<div class="work__media">${media}<span class="work__osd mono" aria-hidden="true">${icon('play-fill')}PLAY</span><span class="work__num mono" aria-hidden="true">${pad2(i + 1)}</span></div>
<div class="work__body"><p class="work__cat">${cat}</p><h3 class="work__title"><a class="work__link" href="${esc(it.url)}"${target}>${esc(it.title)}</a></h3><p class="work__desc">${esc(it.desc)}</p>${tags}${wake}<div class="work__foot">${go}${code}</div></div>
</article>`;
  }).join('\n');
}

function renderMore(w) {
  const rest = w.items.length - (w.initial ?? 7);
  if (rest <= 0) return '';
  return `<div class="works__more"><button class="btn btn--ghost" type="button" id="works-more" aria-controls="works-grid">Показать ещё <span class="mono">${rest}</span></button></div>`;
}

const liveLine = (at, stale) => `<p class="chan__live"><span class="live-dot" aria-hidden="true"></span><span>${stale ? 'Данные от' : 'Обновлено'} <time datetime="${esc(at)}" data-ago>${esc(fmtStamp(at))}</time></span></p>`;

function renderYtChannel(cfg, yt) {
  const ch = yt?.channel || {};
  const stats = [];
  if (Number.isFinite(ch.subs)) stats.push(`<span><b>${num(ch.subs)}</b> ${plural(ch.subs, SUBS)}</span>`);
  if (Number.isFinite(ch.videos)) stats.push(`<span><b>${num(ch.videos)}</b> видео</span>`);
  const top = Math.max(0, ...(yt?.trending || []).map((v) => v.views || 0));
  if (top >= 1000) {
    // Число моноширинным, единицу («тыс.», «млн») обычным шрифтом.
    const c = compact(top), cut = top >= 10000 ? c.lastIndexOf('\u00a0') : -1;
    const shown = cut > 0 ? `<b>${c.slice(0, cut)}</b>\u00a0${c.slice(cut + 1)}` : `<b>${c}</b>`;
    stats.push(`<span>рекорд шортса ${shown} ${plural(top >= 10000 ? 5 : top, VIEWS)}</span>`);
  }
  const ava = has('assets/img/yt/avatar-96.webp')
    ? '<img class="chan__ava" src="assets/img/yt/avatar-96.webp" srcset="assets/img/yt/avatar-96.webp 96w, assets/img/yt/avatar-192.webp 192w" sizes="56px" width="56" height="56" alt="" loading="lazy" decoding="async">'
    : '<span class="chan__ava" aria-hidden="true"></span>';
  return `<div class="chan" data-reveal>
${ava}
<div class="chan__info"><p class="chan__name">${icon('youtube-logo')}${esc(ch.name || 'badVIno')}</p>${stats.length ? `<p class="chan__stats">${stats.join('')}</p>` : ''}${yt ? liveLine(yt.fetchedAt, yt.stale) : ''}</div>
<a class="btn btn--ghost chan__cta" href="https://www.youtube.com/channel/${esc(cfg.youtube.channelId)}?sub_confirmation=1" target="_blank" rel="noopener">${icon('youtube-logo')}Подписаться</a>
</div>`;
}

const emptyBlock = (h, p, href, label, ic) => `<div class="empty" data-reveal><p class="empty__h">${esc(h)}</p><p>${esc(p)}</p><a class="btn btn--ghost" href="${esc(href)}" target="_blank" rel="noopener">${icon(ic)}${esc(label)}</a></div>`;

const vidTitle = (cfg, v) => cfg.youtube.titles?.[v.id] || tidyTitle(v.title, v.description);

function renderFresh(cfg, yt) {
  const chan = `https://www.youtube.com/channel/${cfg.youtube.channelId}/videos`;
  if (!yt) return emptyBlock('Видео не загрузились', 'YouTube не ответил при последней сборке. Все выпуски лежат на канале.', chan, 'Открыть канал', 'youtube-logo');
  if (!yt.fresh?.length) return emptyBlock('Новых выпусков пока нет', 'Первый длинный ролик появится здесь сам. А пока загляни в шортсы ниже.', chan, 'Открыть канал', 'youtube-logo');
  return yt.fresh.map((v, i) => {
    const main = i === 0;
    const title = vidTitle(cfg, v);
    const base = `assets/img/yt/${v.id}`;
    const summary = summarize(v.description, main ? 260 : 180);
    const chapters = main ? chaptersOf(v.description) : [];
    const isNew = ageDays(v.published) < 7;
    const sizes = main ? '(min-width:1280px) 720px, (min-width:1024px) 58vw, calc(100vw - 32px)' : '(min-width:1280px) 464px, (min-width:1024px) 37vw, calc(100vw - 32px)';
    const cover = has(`${base}-640.webp`) ? `<img src="${base}-640.webp" srcset="${base}-640.webp 640w, ${base}-1280.webp 1280w" sizes="${sizes}" width="1280" height="720" alt="" loading="lazy" decoding="async">` : '';
    const label = `Смотреть видео: ${title}${v.duration ? `, ${durWords(v.duration)}` : ''}`;
    const chap = chapters.length ? `<details class="chapters"><summary><span>Таймкоды <span class="mono">${chapters.length}</span></span>${icon('caret-down')}</summary><ol>${chapters.map((c) => `<li><button class="chapter" type="button" data-for="${v.id}" data-t="${c.t}"><time class="mono" datetime="${isoDur(c.t)}">${fmtDur(c.t)}</time><span>${esc(c.label)}</span></button></li>`).join('')}</ol></details>` : '';
    return `<article class="vid${main ? ' vid--main' : ''}" data-reveal style="--d:${i}">
<a class="yt" href="https://www.youtube.com/watch?v=${v.id}" data-yt="${v.id}" data-title="${esc(title)}" target="_blank" rel="noopener" aria-label="${esc(label)}">${cover}<span class="yt__play" aria-hidden="true">${icon('play-fill')}</span>${isNew ? '<span class="yt__badge yt__new" aria-hidden="true">Новое</span>' : ''}${v.duration ? `<span class="yt__badge yt__dur mono" aria-hidden="true">${fmtDur(v.duration)}</span>` : ''}</a>
<h4 class="vid__title">${esc(title)}</h4>
<p class="vid__meta"><span>${icon('eye')}${num(v.views || 0)} ${plural(v.views || 0, VIEWS)}</span><span>${icon('calendar-blank')}${rel(v.published)}</span></p>
${summary ? `<p class="vid__desc">${esc(summary)}</p>` : ''}${chap}
</article>`;
  }).join('\n');
}

function renderTrending(cfg, yt) {
  const shorts = `https://www.youtube.com/channel/${cfg.youtube.channelId}/shorts`;
  if (!yt?.trending?.length) {
    return `<li class="shorts__empty">${emptyBlock(yt ? 'Шортсов пока нет' : 'Шортсы не загрузились', yt ? 'Как только выйдет первый, он окажется здесь.' : 'YouTube не ответил при последней сборке. Все шортсы на канале.', shorts, 'Смотреть шортсы', 'youtube-logo')}</li>`;
  }
  return yt.trending.map((v, i) => {
    const title = vidTitle(cfg, v);
    const base = `assets/img/yt/${v.id}`;
    const cover = has(`${base}-270.webp`)
      ? `<img src="${base}-270.webp" srcset="${base}-270.webp 270w, ${base}-540.webp 540w" sizes="(min-width:1280px) 224px, (min-width:1024px) 18vw, (min-width:768px) 30vw, (min-width:640px) 38vw, 64vw" width="540" height="960" alt="" loading="lazy" decoding="async">`
      : '';
    const views = v.views || 0;
    return `<li class="short" data-reveal style="--d:${i}">
<a class="yt yt--v" href="https://www.youtube.com/shorts/${v.id}" data-yt="${v.id}" data-title="${esc(title)}" target="_blank" rel="noopener" aria-label="${esc(`Смотреть шортс: ${title}`)}">${cover}<span class="yt__play" aria-hidden="true">${icon('play-fill')}</span><span class="yt__badge yt__rank mono" aria-hidden="true">${icon('fire')}${pad2(i + 1)}</span><span class="yt__badge yt__views mono" aria-hidden="true">${icon('eye')}${compact(views)}</span></a>
<h4 class="short__title">${esc(title)}</h4>
<p class="short__meta">${num(views)} ${plural(views, VIEWS)} · ${rel(v.published)}</p>
</li>`;
  }).join('\n');
}

function renderYtLd(cfg, yt) {
  if (!yt?.fresh?.length) return '';
  const site = cfg.site.url;
  const graph = yt.fresh.map((v) => ({
    '@type': 'VideoObject',
    name: vidTitle(cfg, v),
    description: summarize(v.description, 300) || vidTitle(cfg, v),
    thumbnailUrl: [`${site}assets/img/yt/${v.id}-1280.webp`, `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`],
    uploadDate: v.published,
    ...(v.duration ? { duration: isoDur(v.duration) } : {}),
    url: `https://www.youtube.com/watch?v=${v.id}`,
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
    interactionStatistic: { '@type': 'InteractionCounter', interactionType: { '@type': 'WatchAction' }, userInteractionCount: v.views || 0 }
  }));
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
}

function renderTgChannel(cfg, tg) {
  const ch = tg?.channel || {};
  const stats = [];
  if (Number.isFinite(ch.subs)) stats.push(`<span><b>${num(ch.subs)}</b> ${plural(ch.subs, SUBS)}</span>`);
  const tagline = cfg.telegram.tagline || ch.tagline;
  if (tagline) stats.push(`<span>${esc(tagline)}</span>`);
  return `<div class="chan" data-reveal>
<img class="chan__ava chan__ava--tg" src="assets/img/brand/viora-96.webp" srcset="assets/img/brand/viora-96.webp 96w, assets/img/brand/viora-192.webp 192w" sizes="56px" width="56" height="56" alt="" loading="lazy" decoding="async">
<div class="chan__info"><p class="chan__name">${icon('telegram-logo')}VIORA STUDIO</p>${stats.length ? `<p class="chan__stats">${stats.join('')}</p>` : ''}${tg ? liveLine(tg.fetchedAt, tg.stale) : ''}</div>
<a class="btn btn--ghost chan__cta" href="https://t.me/${esc(cfg.telegram.channel)}" target="_blank" rel="noopener">${icon('telegram-logo')}Подписаться</a>
</div>`;
}

function postModel(cfg, p) {
  const o = cfg.telegram.posts?.[p.id] || {};
  const ex = excerpt(p.raw || '');
  const layout = o.layout || (p.role === 'auto' ? 'wide' : '');
  return {
    ...p,
    layout,
    title: o.title || ex.title || (p.photo ? 'Пост с картинкой' : `Пост ${p.id}`),
    text: o.text ?? (o.list ? '' : ex.text),
    list: o.list || (layout === 'wide' ? ex.list : []),
    more: o.more || '',
    alt: o.alt || '',
    tags: (o.tags || p.tags || []).slice(0, 3)
  };
}

function prettyPreview(pv) {
  if (!pv) return null;
  try {
    const u = new URL(pv.url);
    if (/(^|\.)github\.com$/.test(u.hostname)) {
      const [, , repo, , , ...sub] = u.pathname.split('/');
      return { site: 'GitHub', title: [repo, ...sub].filter(Boolean).join(' / '), mono: true, desc: '' };
    }
  } catch { /* ссылка без адреса */ }
  return { site: polish(pv.site || '', { casing: false, cap: false }), title: cut(polish(pv.title || ''), 110), desc: cut(polish(pv.desc || '', { casing: false }), 140) };
}

function renderPosts(cfg, tg) {
  if (!tg?.posts?.length) {
    return `<div class="posts__empty">${emptyBlock(tg ? 'Постов пока нет' : 'Канал не загрузился', tg ? 'Скоро здесь появятся релизы и подборки.' : 'Telegram не ответил при последней сборке. Все посты в канале.', `https://t.me/${cfg.telegram.channel}`, 'Открыть канал', 'telegram-logo')}</div>`;
  }
  const models = tg.posts.map((p) => postModel(cfg, p));
  const order = [...models.filter((m) => m.layout === 'wide'), ...models.filter((m) => m.layout === 'tall'), ...models.filter((m) => !m.layout)];
  return order.map((m, i) => {
    const cls = ['post', m.layout && `post--${m.layout}`].filter(Boolean).join(' ');
    const url = `https://t.me/${cfg.telegram.channel}/${m.id}`;
    const tags = m.tags.length ? `<ul class="post__tags" aria-label="Теги">${m.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
    const list = m.list.length ? `<ul class="post__list">${m.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${m.more ? `<p class="post__more">${esc(m.more)}</p>` : ''}` : '';
    const text = m.text ? `<p class="post__text">${esc(m.text)}</p>` : '';
    let media = '';
    const pb = `assets/img/tg/post-${m.id}`;
    const ws = (m.photo?.widths || []).filter((w) => has(`${pb}-${w}.webp`));
    if (m.photo && ws.length) {
      const big = Math.max(...ws);
      media = `<figure class="post__media"><img src="${pb}-${Math.min(...ws)}.webp" srcset="${ws.map((w) => `${pb}-${w}.webp ${w}w`).join(', ')}" sizes="(min-width:1024px) 384px, (min-width:768px) 50vw, 100vw" width="${big}" height="${Math.round(big * (m.photo.ratio || 1))}" alt="${esc(m.alt || 'Картинка из поста')}" loading="lazy" decoding="async"></figure>`;
    }
    const pv = !list && !media ? prettyPreview(m.preview) : null;
    const preview = pv && pv.title ? `<div class="post__preview"><p class="post__site">${esc(pv.site)}</p><p class="post__ptitle${pv.mono ? ' mono' : ''}">${esc(pv.title)}</p>${pv.desc ? `<p class="post__pdesc">${esc(pv.desc)}</p>` : ''}</div>` : '';
    let doc = '';
    if (m.doc) {
      const ext = (m.doc.name.match(/\.([a-z0-9]{1,5})$/i) || [])[1] || '';
      const name = m.doc.name.replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[-_]+/g, ' ').trim();
      const size = m.doc.size.replace(/\bMB\b/, 'МБ').replace(/\bKB\b/, 'КБ').replace(/\bGB\b/, 'ГБ').replace('.', ',');
      doc = `<p class="post__doc">${icon('file-zip')}<span>${esc(name)}</span><small class="mono">${esc([ext.toUpperCase(), size].filter(Boolean).join(' · '))}</small></p>`;
    }
    const reacts = (m.reactions || []).slice(0, 4).map((r) => `<span class="react">${esc(r.e)} ${num(r.n)}</span>`).join('');
    return `<article class="${cls}" data-reveal style="--d:${i % 3}">
<header class="post__head"><img class="post__ava" src="assets/img/brand/viora-96.webp" width="36" height="36" alt="" loading="lazy" decoding="async"><div class="post__who"><p class="post__name">VIORA STUDIO</p><p class="post__date">${rel(m.date)}</p></div><span class="post__id mono">№ ${m.id}</span></header>
${tags}<h3 class="post__title">${esc(m.title)}</h3>${text}${list}${media}${preview}${doc}
<footer class="post__foot"><span class="post__stat">${icon('eye')}<span class="sr-only">Просмотров:</span>${num(m.views || 0)}</span>${reacts}<a class="post__go post__link" href="${url}" target="_blank" rel="noopener" aria-label="${esc(`Открыть пост в Telegram: ${m.title}`)}">Открыть${icon('arrow-up-right')}</a></footer>
</article>`;
  }).join('\n');
}

function renderFaqLd(html) {
  const qa = [...html.matchAll(/<details name="faq"[^>]*>\s*<summary>([\s\S]*?)<span class="faq__icon"[\s\S]*?<\/summary>\s*<div class="faq__a">([\s\S]*?)<\/div>\s*<\/details>/g)]
    .map((m) => ({ q: squash(decode(stripTags(m[1]))), a: squash(decode(stripTags(m[2]))) }));
  if (!qa.length) return '';
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) };
  return `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
}

const renderUpdated = (at) => `<p class="updated"><span class="live-dot" aria-hidden="true"></span><span>Эфир и канал обновляются сами. Последнее обновление: <time datetime="${esc(at)}" data-ago>${esc(fmtStamp(at))}</time></span></p>`;

function put(html, name, content) {
  const re = new RegExp(`(<!-- @${name} -->)[\\s\\S]*?(<!-- /@${name} -->)`);
  if (!re.test(html)) throw new Error(`в index.html нет маркера @${name}`);
  return html.replace(re, (m, a, b) => `${a}${content ? `\n${content}\n` : ''}${b}`);
}

/* ───────────── сборка ───────────── */

async function main() {
  const cfg = await readJSON(P('data/config.json'));
  const works = await readJSON(P('data/works.json'));
  if (!cfg || !works) throw new Error('не читается data/config.json или data/works.json');
  const prev = (await readJSON(P('data/feed.json'), {})) || {};
  const source = await readFile(P('index.html'), 'utf8');
  let html = source;
  const failures = [];

  let yt = null, tg = null;
  if (!OFFLINE) {
    log('YouTube и Telegram: забираю свежие данные');
    [yt, tg] = await Promise.all([
      fetchYouTube(cfg, prev.youtube).catch((e) => { failures.push(`YouTube: ${e.message}`); return null; }),
      fetchTelegram(cfg, prev.telegram).catch((e) => { failures.push(`Telegram: ${e.message}`); return null; })
    ]);
  }
  if (failures.length && !ALLOW_STALE) {
    failures.forEach(warn);
    if (CI) {
      output('deploy', 'false');
      log('Источник не ответил. Деплой пропущен, на сайте остаётся прошлая версия.');
      return;
    }
    console.error('Источник не ответил. Запусти с ALLOW_STALE=1 или с флагом --offline, чтобы собрать из прошлых данных.');
    process.exit(1);
  }
  failures.forEach(warn);
  if (!yt && prev.youtube) yt = { ...prev.youtube, stale: !OFFLINE };
  if (!tg && prev.telegram) tg = { ...prev.telegram, stale: !OFFLINE };

  if (!OFFLINE) {
    if (!sharp) warn('sharp не установлен, обложки не обновятся. Выполни npm ci --prefix scripts');
    if (yt && !yt.stale) await youtubeImages(yt).catch((e) => warn(`обложки YouTube: ${e.message}`));
    if (tg && !tg.stale) await telegramImages(tg).catch((e) => warn(`картинки Telegram: ${e.message}`));
  }

  html = put(html, 'works-filters', renderFilters(works));
  html = put(html, 'works', renderWorks(works));
  html = put(html, 'works-more', renderMore(works));
  html = html.replace(/(<div class="works__grid" id="works-grid")[^>]*>/, `$1 data-initial="${works.initial ?? 7}">`);
  html = html.replace(/(<span data-count="works" data-forms="([^"]+)">)([\s\S]*?)(<\/span>)/g, (m, open, forms, inner, close) => {
    const n = works.items.length;
    return `${open}${/<b class="mono">/.test(inner) ? `<b class="mono">${n}</b>` : n} ${plural(n, forms.split(','))}${close}`;
  });
  html = put(html, 'yt-channel', renderYtChannel(cfg, yt));
  html = put(html, 'yt-fresh', renderFresh(cfg, yt));
  html = put(html, 'yt-trending', renderTrending(cfg, yt));
  html = put(html, 'yt-ld', renderYtLd(cfg, yt));
  html = put(html, 'tg-channel', renderTgChannel(cfg, tg));
  html = put(html, 'tg-posts', renderPosts(cfg, tg));
  html = put(html, 'faq-ld', renderFaqLd(html));
  const times = [yt?.fetchedAt, tg?.fetchedAt].filter(Boolean).sort();
  if (times.length) html = put(html, 'updated', renderUpdated(times[0]));

  const bust = {};
  for (const f of ['assets/css/style.css', 'assets/js/main.js']) bust[f] = createHash('sha1').update(await readFile(P(f))).digest('hex').slice(0, 8);
  const busted = (s) => Object.entries(bust).reduce((acc, [f, h]) => acc.replace(new RegExp(`${f.replace(/\./g, '\\.')}\\?v=[\\w.]+`, 'g'), `${f}?v=${h}`), s);
  html = busted(html);

  if (html !== source) { await writeFile(P('index.html'), html); log('index.html обновлён'); } else log('index.html без изменений');
  for (const f of ['404.html', 'privacy.html']) {
    if (!existsSync(P(f))) continue;
    const s = await readFile(P(f), 'utf8');
    const t = busted(s);
    if (t !== s) await writeFile(P(f), t);
  }
  if (existsSync(P('sitemap.xml'))) {
    const s = await readFile(P('sitemap.xml'), 'utf8');
    const t = s.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${isoDay(times.length ? new Date(times[times.length - 1]) : NOW)}</lastmod>`);
    if (t !== s) await writeFile(P('sitemap.xml'), t);
  }
  if (!OFFLINE) {
    const strip = (x) => (x ? (({ stale, ...rest }) => rest)(x) : null);
    const feed = { generatedAt: NOW.toISOString(), youtube: strip(yt) || prev.youtube || null, telegram: strip(tg) || prev.telegram || null };
    await writeFile(P('data/feed.json'), JSON.stringify(feed, null, 2) + '\n');
  }

  // Убираем обложки, на которые больше никто не ссылается.
  for (const [dir, re] of [['assets/img/yt', /^[\w-]{11}-\d+\.webp$/], ['assets/img/tg', /^post-\d+-\d+\.webp$/]]) {
    for (const f of await readdir(P(dir)).catch(() => [])) {
      if (re.test(f) && !html.includes(`${dir}/${f}`)) { await unlink(P(dir, f)); log(`удалён ${dir}/${f}`); }
    }
  }

  const missing = [...new Set([...html.matchAll(/href="#(i-[\w-]+|wm-letters|stamp)"/g)].map((m) => m[1]))].filter((id) => !html.includes(`id="${id}"`));
  if (missing.length) warn(`в спрайте нет иконок: ${missing.join(', ')}`);

  output('deploy', 'true');
  log(`готово: ${works.items.length} ${plural(works.items.length, ['работа', 'работы', 'работ'])}, ${yt?.fresh?.length || 0} + ${yt?.trending?.length || 0} ${plural((yt?.fresh?.length || 0) + (yt?.trending?.length || 0), ['ролик', 'ролика', 'роликов'])}, ${tg?.posts?.length || 0} ${plural(tg?.posts?.length || 0, ['пост', 'поста', 'постов'])}${failures.length ? ', часть данных из прошлого запуска' : ''}`);
}

export { tidyTitle, summarize, chaptersOf, excerpt, polish, dehyphen, parseFeed, parseTgPosts, parseTgChannel, prettyPreview };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
