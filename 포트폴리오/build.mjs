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
import * as A from './arch.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = HERE; // 결과 PDF · PPTX 는 이 폴더에 바로 저장
const BUILD_DIR = path.join(HERE, '.build');
const BASENAME = 'AI쇼핑몰_RAG_LLM_포트폴리오';
const args = new Set(process.argv.slice(2));

const metrics = fs.existsSync(path.join(HERE, 'data/metrics.json'))
  ? JSON.parse(fs.readFileSync(path.join(HERE, 'data/metrics.json'), 'utf8'))
  : {};
// 에이전트 평가 (local-env/agent_eval.py)
if (fs.existsSync(path.join(HERE, 'data/agent_metrics.json'))) {
  const am = JSON.parse(fs.readFileSync(path.join(HERE, 'data/agent_metrics.json'), 'utf8'));
  metrics.agent = am.metrics;
  metrics.agentRows = am.rows;  // 시나리오별 채점 (평가 쪽 매트릭스)
}

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
function shot(name, { url = '', h = 420, contain = false, markers = [], boxes = [], pos = 'top left', crop, bar = true, full = false } = {}) {
  const file = path.join(SHOTS, `${name}.png`);
  if (!fs.existsSync(file)) {
    return `<div class="shot" style="height:${h}px">${bar ? `<div class="bar"><i></i><i></i><i></i><span>${esc(url)}</span></div>` : ''}
      <div class="img"><div class="ph"><div><b>캡처 예정</b><br/>shots/${esc(name)}.png</div></div></div></div>`;
  }
  const src = pathToFileURL(file).href + `?v=${fs.statSync(file).mtimeMs | 0}`;
  let img;
  let boxStyle = '';
  let frameStyle = `height:${h}px`;
  if (full) crop = [0, 0, pngSize(file).w, pngSize(file).h];
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
  // f: 면 위의 위치 (0~1, 기본 가운데) — 두 선이 같은 면을 쓸 때 겹치지 않게
  const side = (n, s, f = 0.5) => ({
    r: [n.x + n.w, n.y + n.h * f], l: [n.x, n.y + n.h * f],
    t: [n.x + n.w * f, n.y], b: [n.x + n.w * f, n.y + n.h],
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
    const [x1, y1] = side(A, sa, o.af), [x2, y2] = side(B, sb, o.bf);
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

// 에이전트 실행 기록(같은 캡처 실행) · 도구 출력 예
const readJson = (rel) => (fs.existsSync(path.join(HERE, rel)) ? JSON.parse(fs.readFileSync(path.join(HERE, rel), 'utf8')) : null);
V.trace = readJson('shots/agent-multi.trace.json') || [];
V.tools = readJson('data/tool_examples.json') || {};
V.boxes = readJson('shots/agent-multi.boxes.json');
V.forced = readJson('data/forced_eval.json');      // 확정 호출 장애 주입 평가
V.forced_v1 = readJson('data/forced_eval_v1.json');
V.ctx = readJson('data/context_budget.json');
V.act = readJson('data/action_metrics.json');
V.act_v1 = readJson('data/action_metrics_v1.json');     // 수정 전 첫 평가 (개선 과정 비교)           // 실행 · 멀티턴 · 연쇄 · 보안 평가 (local-env/action_eval.py)
V.confirmBoxes = readJson('shots/agent-confirm.boxes.json');
V.actionBoxes = readJson('shots/agent-action.boxes.json');          // 컨텍스트 예산 (local-env/context_budget.py)  // 캡처 때 기록한 요소 위치 → 번호 표시

const list = pages({ shot, py, ts, M, has, dg, asset, V, MX: metrics, A });
// 오른쪽 위 장 표시: "III. 설계 · ② 에이전트 그래프" — 장 순서는 쪽의 ch 값 순서
const CHAPTERS = [...new Set(list.map((p) => p.ch).filter(Boolean))];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const CIRC = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮';
const seen = {};
const total = list.length;
const sections = list.map((p, i) => {
  if (p.cover) return `<section class="page cover ${p.cls || ''}">${p.html}</section>`;
  seen[p.ch] = (seen[p.ch] || 0) + 1;
  const crumb = `${ROMAN[CHAPTERS.indexOf(p.ch)]}. ${esc(p.ch)} · ${CIRC[seen[p.ch] - 1]} ${esc(p.crumb || '')}`;
  return `<section class="page">
    <header><h1>${p.title}</h1><span class="crumb">${crumb}</span></header>
    ${p.msg ? `<p class="msg">${p.msg}</p>` : ''}
    <div class="body">${p.body}</div>
    <footer><span>${esc(META.footer || 'Portfolio')} | ${esc(META.name)}</span><span>${i + 1}</span></footer>
  </section>`;
});

// 서체: Pretendard (fonts/, SIL OFL) — 로컬 파일을 그대로 씀
const FONT_W = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800 };
const fontCss = Object.entries(FONT_W).map(([n, w]) => {
  const f = path.join(HERE, 'fonts', `Pretendard-${n}.woff2`);
  return fs.existsSync(f) ? `@font-face{font-family:"Pretendard";font-weight:${w};src:url("${pathToFileURL(f).href}") format("woff2");}` : '';
}).join('');
const css = fontCss + fs.readFileSync(path.join(HERE, 'portfolio.css'), 'utf8');
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
await page.evaluate(() => Promise.all([...document.fonts].map((f) => f.load())));

// 넘침 검사: 본문이 바닥글을 침범하거나, 코드 블록이 잘리면 경고
const overflow = await page.evaluate(() =>
  [...document.querySelectorAll('section.page')].flatMap((s, i) => {
    const limit = s.getBoundingClientRect().bottom - 40;
    const out = [];
    // 안쪽 요소까지 (flex 로 높이가 묶인 줄은 겉 상자가 넘치지 않아도 안의 행이 넘침)
    for (const e of s.querySelectorAll('.body > *, .panel, .box1, pre.code, .shot, .msg, .lanes > *, .gate, .dec, .eset, tr, .lane2, .cmp-r, .strip > *, .pcol, .feat, .evi, svg.d')) {
      if (e.getBoundingClientRect().bottom > limit + 1) out.push(`${i + 1}쪽 바닥 침범 ${Math.round(e.getBoundingClientRect().bottom - limit)}px (${e.className?.baseVal ?? e.className})`);
    }
    for (const e of s.querySelectorAll('.card')) {
      if (e.scrollHeight > e.clientHeight + 2) out.push(`${i + 1}쪽 카드 내용 넘침`);
    }
    // 좌우 여백 침범 (그리드 칸이 nowrap 글자 때문에 밀려나는 경우 등)
    const body = s.querySelector('.body')?.getBoundingClientRect();
    if (body) {
      for (const e of s.querySelectorAll('.body > *, .body .panel, .body .evi, .body .shot, .body table, .body svg.d, .body .gate')) {
        const r = e.getBoundingClientRect();
        if (r.right > body.right + 1 || r.left < body.left - 1) out.push(`${i + 1}쪽 좌우 여백 침범(${e.className?.baseVal ?? e.className ?? e.tagName})`);
      }
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
  console.log(`미리보기 ${files.length}쪽 → 포트폴리오/preview/`);
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
