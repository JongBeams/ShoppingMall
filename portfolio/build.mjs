// 포트폴리오 빌드: pages.mjs + portfolio.css + shots/*.png → PDF · PPTX
//
//   node build.mjs             PDF + PPTX  (결과: ../포트폴리오/)
//   node build.mjs --pdf-only  PDF 만
//   node build.mjs --preview   쪽별 PNG 만 (preview/)
//
// 측정값은 data/metrics.json 에서 읽습니다 (local-env/measure.py 가 만듭니다).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';
import { pages, META } from './pages.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, '..', '포트폴리오');
const BUILD_DIR = path.join(HERE, '.build');
const BASENAME = 'AI쇼핑몰_RAG_LLM_포트폴리오';
const args = new Set(process.argv.slice(2));

const metrics = fs.existsSync(path.join(HERE, 'data/metrics.json'))
  ? JSON.parse(fs.readFileSync(path.join(HERE, 'data/metrics.json'), 'utf8'))
  : {};

// ------------------------------------------------------------ helpers
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function M(key, fallback = '측정 중', raw = false) {
  const v = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), metrics);
  if (v == null) return `<span style="color:#94a3b8">${raw ? fallback : esc(fallback)}</span>`;
  return raw ? String(v) : esc(v);
}

const KW = /\b(def|return|if|else|elif|for|in|not|and|or|import|from|with|try|except|yield|async|await|class|None|True|False|as|lambda|const|let|await)\b/;
const TOKEN = /(#[^\n]*)|("""[\s\S]*?"""|f?"(?:[^"\\\n]|\\.)*"|f?'(?:[^'\\\n]|\\.)*')|\b(def|return|if|else|elif|for|in|not|and|or|import|from|with|try|except|yield|async|await|class|None|True|False|as|lambda)\b|\b(\d[\d_.]*)\b/g;

function highlight(code, raw) {
  let src = code;
  if (raw) src = src.replace(/<span class="hl">/g, '\u0001').replace(/<\/span>/g, '\u0002');
  let out = '';
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    out += esc(src.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 'n';
    out += `<span class="${cls}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  out += esc(src.slice(last));
  if (raw) out = out.replace(/\u0001/g, '<span class="hl">').replace(/\u0002/g, '</span>');
  return out;
}

// py(코드, 파일명, raw, 'sm') — raw 면 <span class="hl"> 강조를 허용, 'sm' 은 작은 글씨
const py = (code, file = '', raw = false, size = '') =>
  `<pre class="code ${size}">${file ? `<span class="fn">${esc(file)}</span>` : ''}${highlight(code.replace(/^\n/, ''), raw)}</pre>`;
const ts = py;

const SHOTS = path.join(HERE, 'shots');
const has = (name) => fs.existsSync(path.join(SHOTS, `${name}.png`));

// PNG 크기 (CSS px = 실제 px / dpr)
function pngSize(file, dpr = 2) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16) / dpr, h: b.readUInt32BE(20) / dpr };
}

// shot(이름, { url, h, contain, crop:[x, y|'bottom', w, h], markers:[[x%,y%,'라벨']], boxes:[[x%,y%,w%,h%]] })
//   crop 좌표는 캡처 화면의 CSS px. 지정하면 프레임 높이는 crop 비율로 정해집니다.
//   markers / boxes 좌표는 보이는 영역 기준 %.
function shot(name, { url = '', h = 420, contain = false, markers = [], boxes = [], pos = 'top left', crop, bar = true } = {}) {
  const file = path.join(SHOTS, `${name}.png`);
  if (!fs.existsSync(file)) {
    return `<div class="shot" style="height:${h}px">${bar ? `<div class="bar"><i></i><i></i><i></i><span>${esc(url)}</span></div>` : ''}
      <div class="img"><div class="ph"><div><b>캡처 예정</b><br/>shots/${esc(name)}.png</div></div></div></div>`;
  }
  const src = pathToFileURL(file).href + `?v=${fs.statSync(file).mtimeMs | 0}`;
  let img;
  let boxStyle = '';
  let frameStyle = `height:${h}px`;
  if (crop) {
    const S = pngSize(file);
    let [x, y, w, ch] = crop;
    if (y === 'bottom') y = S.h - ch;
    img = `<img src="${src}" style="position:absolute;max-width:none;height:auto;object-fit:fill;
      width:${(S.w / w) * 100}%;left:${-(x / w) * 100}%;top:${-(y / ch) * 100}%"/>`;
    boxStyle = `aspect-ratio:${w} / ${ch};flex:none`;
    frameStyle = '';
  } else {
    img = `<img src="${src}" style="object-position:${pos}"/>`;
  }
  const over =
    boxes.map((b) => `<div class="box" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%"></div>`).join('') +
    markers.map((m, i) => `<div class="mk" style="left:${m[0]}%;top:${m[1]}%">${m[2] ?? i + 1}</div>`).join('');
  return `<div class="shot${contain ? ' contain' : ''}" style="${frameStyle}">
    ${bar ? `<div class="bar"><i></i><i></i><i></i><span>${esc(url)}</span></div>` : ''}
    <div class="img" style="${boxStyle}">${img}${over}</div></div>`;
}

// ------------------------------------------------------------ assemble
// ------------------------------------------------------------ 도식 (흐름도)
// dg({ w, h, nodes: { id: { x, y, w, h, t, s, tag, k } }, edges: [[from, to, label, { a, b, dash }]] })
//   k: '' 기본 · 'a' 강조 테두리 · 'f' 강조 채움 · 'd' 어두운 노드 · 'g' 회색 그룹 상자(뒤에 깔림)
//   a/b: 출발·도착 면 ('r' 'l' 't' 'b'), 생략하면 위치로 판단
function dg({ w, h, nodes, edges = [], cls = '' }) {
  const N = nodes;
  const side = (n, s) => ({
    r: [n.x + n.w, n.y + n.h / 2], l: [n.x, n.y + n.h / 2],
    t: [n.x + n.w / 2, n.y], b: [n.x + n.w / 2, n.y + n.h],
  })[s];
  const auto = (A, B) => {
    if (B.x >= A.x + A.w) return ['r', 'l'];
    if (B.x + B.w <= A.x) return ['l', 'r'];
    return B.y >= A.y + A.h ? ['b', 't'] : ['t', 'b'];
  };
  let paths = '';
  let labels = '';
  for (const [f, t, label, o = {}] of edges) {
    const A = N[f], B = N[t];
    const [sa, sb] = [o.a, o.b].every(Boolean) ? [o.a, o.b] : auto(A, B);
    const [x1, y1] = side(A, sa), [x2, y2] = side(B, sb);
    let d, lx, ly;
    if ('rl'.includes(sa) && 'rl'.includes(sb)) {
      const xm = o.xm ?? (x1 + x2) / 2;
      d = `M${x1},${y1} H${xm} V${y2} H${x2}`; lx = (y1 === y2) ? (x1 + x2) / 2 : xm; ly = (y1 === y2) ? y1 : (y1 + y2) / 2;
    } else if ('tb'.includes(sa) && 'tb'.includes(sb)) {
      const ym = o.ym ?? (y1 + y2) / 2;
      d = `M${x1},${y1} V${ym} H${x2} V${y2}`; lx = (x1 === x2) ? x1 : (x1 + x2) / 2; ly = (x1 === x2) ? (y1 + y2) / 2 : ym;
    } else if ('rl'.includes(sa)) {
      d = `M${x1},${y1} H${x2} V${y2}`; lx = (x1 + x2) / 2; ly = y1;
    } else {
      d = `M${x1},${y1} V${y2} H${x2}`; lx = x1; ly = (y1 + y2) / 2;
    }
    paths += `<path d="${d}" class="${o.dash ? 'dash' : ''}${o.hot ? ' hot' : ''}" marker-end="url(#ah${o.hot ? 'h' : ''})"/>`;
    if (label) labels += `<div class="el${o.hot ? ' hot' : ''}" style="left:${(o.lx ?? lx)}px;top:${(o.ly ?? ly)}px">${label}</div>`;
  }
  const boxes = Object.entries(N).map(([, n]) =>
    `<div class="dn ${n.k || ''} ${n.cls || ''}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px">` +
    (n.tag ? `<span class="tg">${n.tag}</span>` : '') +
    (n.t ? `<b>${n.t}</b>` : '') + (n.s ? `<i>${n.s}</i>` : '') + (n.html || '') + `</div>`).join('');
  return `<div class="dg ${cls}" style="width:${w}px;height:${h}px">
    ${boxes}
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9aa3b5"/></marker>
        <marker id="ahh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#3346c9"/></marker>
      </defs>${paths}</svg>
    ${labels}</div>`;
}

// 썸네일 등 shots/ 아래 파일 URL
const asset = (rel) => pathToFileURL(path.join(SHOTS, rel)).href;
const V = fs.existsSync(path.join(HERE, 'data/visual.json'))
  ? JSON.parse(fs.readFileSync(path.join(HERE, 'data/visual.json'), 'utf8')) : {};

const list = pages({ shot, py, ts, M, has, dg, asset, V, MX: metrics });
const total = list.length;
const sections = list.map((p, i) => {
  if (!p.theme) p.theme = 't-rag';
  if (p.cover) return `<section class="page cover">${p.html}</section>`;
  return `<section class="page ${p.theme || 't-ink'}">
    <div class="kicker"><span class="no">${p.no}</span>${esc(p.kicker)}</div>
    <h1 class="title">${p.title}</h1>
    ${p.lead ? `<p class="lead">${p.lead}</p>` : ''}
    <div class="body">${p.body}</div>
    <div class="foot"><span>AI 쇼핑몰 · RAG / LLM 포트폴리오 · ${esc(META.name)}</span><span class="pg">${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div>
  </section>`;
});

const css = fs.readFileSync(path.join(HERE, 'portfolio.css'), 'utf8');
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><title>${BASENAME}</title>
<style>${css}</style></head><body>${sections.join('\n')}</body></html>`;

fs.mkdirSync(BUILD_DIR, { recursive: true });
const htmlPath = path.join(BUILD_DIR, 'portfolio.html');
fs.writeFileSync(htmlPath, html);

// ------------------------------------------------------------ render
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: args.has('--preview') ? 1 : 2 });
const page = await ctx.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

// 넘침 검사: 본문이 바닥글을 침범하거나, 코드 블록이 잘리면 경고
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll('section.page')].flatMap((s, i) => {
    const limit = s.getBoundingClientRect().bottom - 34;
    const out = [];
    for (const e of s.querySelectorAll('.body > *, .card, pre.code, .shot, .lead')) {
      if (e.getBoundingClientRect().bottom > limit + 1) out.push(`${i + 1}쪽 바닥 침범(${e.className})`);
    }
    for (const e of s.querySelectorAll('.card')) {
      if (e.scrollHeight > e.clientHeight + 2) out.push(`${i + 1}쪽 카드 내용 넘침`);
    }
    for (const e of s.querySelectorAll('pre.code')) {
      if (e.scrollWidth > e.clientWidth + 2) out.push(`${i + 1}쪽 코드 가로 잘림`);
      if (e.scrollHeight > e.clientHeight + 2) out.push(`${i + 1}쪽 코드 세로 잘림`);
    }
    return [...new Set(out)];
  }));
if (overflow.length) console.warn(`⚠ 넘침:\n  ${overflow.join('\n  ')}`);

fs.mkdirSync(OUT_DIR, { recursive: true });

async function screenshots(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const els = await page.$$('section.page');
  const files = [];
  for (let i = 0; i < els.length; i++) {
    const f = path.join(dir, `${String(i + 1).padStart(2, '0')}_${list[i].id}.png`);
    await els[i].screenshot({ path: f });
    files.push(f);
  }
  return files;
}

if (args.has('--preview')) {
  const files = await screenshots(path.join(HERE, 'preview'));
  console.log(`미리보기 ${files.length}쪽 → portfolio/preview/`);
} else {
  await page.emulateMedia({ media: 'print' });
  const pdfPath = path.join(OUT_DIR, `${BASENAME}.pdf`);
  await page.pdf({ path: pdfPath, width: '1280px', height: '720px', printBackground: true, preferCSSPageSize: true });
  console.log(`PDF  ${total}쪽 → ${path.relative(path.resolve(HERE, '..'), pdfPath)}`);

  if (!args.has('--pdf-only')) {
    await page.emulateMedia({ media: 'screen' });
    const files = await screenshots(path.join(BUILD_DIR, 'slides'));
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
    pptx.title = BASENAME;
    pptx.author = META.name;
    files.forEach((f, i) => {
      const s = pptx.addSlide();
      s.addImage({ path: f, x: 0, y: 0, w: 13.333, h: 7.5 });
      if (list[i].notes) s.addNotes(list[i].notes);
    });
    const pptxPath = path.join(OUT_DIR, `${BASENAME}.pptx`);
    await pptx.writeFile({ fileName: pptxPath });
    console.log(`PPTX ${total}장 → ${path.relative(path.resolve(HERE, '..'), pptxPath)}`);
  }
}
await browser.close();
