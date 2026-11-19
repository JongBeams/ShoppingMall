// 개발 웹 화면을 실제로 조작해 shots/*.png 로 캡처합니다.
// 먼저 로컬 재현 환경이 떠 있어야 합니다:  npm run env:start  (프론트 13000 · 백엔드 18000)
//
//   node capture/capture.mjs            전체
//   node capture/capture.mjs chat-rag   이름을 주면 그것만
//
// LLM 응답(로컬 qwen2.5:14b)을 실제로 기다리므로 전체 실행은 몇 분 걸립니다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SHOTS = path.join(ROOT, 'shots');
const QUERY = path.join(ROOT, 'local-env', 'assets', 'query');
const WEB = process.env.WEB_URL || 'http://localhost:13000';
const API = process.env.API_URL || 'http://localhost:18000';
const LLM_WAIT = 15 * 60_000;
fs.mkdirSync(SHOTS, { recursive: true });

const only = new Set(process.argv.slice(2));
const want = (name) => only.size === 0 || only.has(name);
const log = (...a) => console.log(new Date().toLocaleTimeString('ko-KR'), ...a);

const browser = await chromium.launch({ args: ['--lang=ko-KR'] });

async function newPage({ auth } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'ko-KR', colorScheme: 'light',
  });
  // 일부 화면(이미지 검색)은 API 주소가 localhost:8000 으로 고정돼 있어 재현 환경 포트로 돌립니다.
  await ctx.route(/\/\/localhost:8000\//, (route) =>
    route.continue({ url: route.request().url().replace('localhost:8000', new URL(API).host) }));
  // Next.js 개발 표시 숨김
  await ctx.addInitScript(() => {
    const css = 'nextjs-portal{display:none!important}';
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    });
  });
  if (auth) {
    const storage = await login(ctx, auth);
    await ctx.addInitScript((kv) => { for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v); }, storage);
  }
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  return page;
}

async function login(ctx, who) {
  if (who === 'admin') {
    const r = await ctx.request.post(`${API}/admin/login`, { data: { email: 'admin@example.com', password: 'admin1234!' } });
    const d = await r.json();
    return { admin_token: d.access_token, admin_user: JSON.stringify(d.user) };
  }
  const r = await ctx.request.post(`${API}/auth/login`, { data: { email: 'demo@example.com', password: 'demo1234!' } });
  const d = await r.json();
  if (!d.access_token) throw new Error(`로그인 실패: ${JSON.stringify(d).slice(0, 200)}`);
  return { access_token: d.access_token, refresh_token: d.refresh_token, user: JSON.stringify(d.user) };
}

const chatPanel = (page) => page.locator('div.fixed.bottom-24.right-6');

async function askChat(page, modeLabel, question, { waitFor } = {}) {
  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
  await page.locator('button.fixed.bottom-6.right-6').click();
  await page.getByRole('button', { name: new RegExp(modeLabel) }).click();
  await page.getByPlaceholder('메시지 입력...').fill(question);
  await page.getByPlaceholder('메시지 입력...').press('Enter');
  log(`  … "${question}" 응답 대기 (LLM)`);
  if (waitFor) await waitFor(page);
  // 스트리밍 종료: 로딩 점이 사라지고 입력창이 다시 활성화될 때까지
  await page.waitForFunction(() => !document.querySelector('.animate-bounce'), null, { timeout: LLM_WAIT });
  await page.waitForTimeout(1200);
  // 대화 전체가 한 장에 들어오도록 패널을 내용 높이만큼 늘림 (질문 → 답변 → 상품 카드)
  const panel = chatPanel(page);
  const need = await panel.evaluate((el) => {
    const sc = [...el.querySelectorAll('.overflow-y-auto')].sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    return sc ? el.offsetHeight - sc.clientHeight + sc.scrollHeight + 4 : el.offsetHeight;
  });
  if (need > 700) {
    await page.setViewportSize({ width: 1440, height: need + 140 });
    await panel.evaluate((el, h) => { el.style.height = `${h}px`; }, need);
  }
  await panel.evaluate((el) => el.querySelectorAll('.overflow-y-auto').forEach((s) => (s.scrollTop = 0)));
  await page.waitForTimeout(400);
}

async function shot(page, name, target) {
  const file = path.join(SHOTS, `${name}.png`);
  if (target) await target.screenshot({ path: file });
  else await page.screenshot({ path: file });
  log(`✓ ${name}.png`);
}

// ------------------------------------------------------------------ 시나리오
const jobs = {
  'crm-documents': async () => {
    const page = await newPage({ auth: 'admin' });
    await page.goto(`${WEB}/crm/documents`, { waitUntil: 'networkidle' });
    await page.getByText('업로드된 문서').first().waitFor();
    await page.locator('table tbody tr').first().waitFor();
    await page.waitForTimeout(800);
    await shot(page, 'crm-documents');
  },

  'chat-modes': async () => {
    const page = await newPage();
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.locator('button.fixed.bottom-6.right-6').click();
    await page.getByText('상담 방식을 선택해주세요').waitFor();
    await page.waitForTimeout(500);
    await shot(page, 'chat-modes', chatPanel(page));
  },

  'chat-rag': async () => {
    const page = await newPage();
    await askChat(page, 'AI 규정문서', '단순 변심으로 반품하면 배송비는 얼마야?', {
      waitFor: (p) => p.getByText('참고:').waitFor({ timeout: LLM_WAIT }),
    });
    await shot(page, 'chat-rag', chatPanel(page));
  },

  'chat-shop': async () => {
    const page = await newPage();
    await askChat(page, 'AI 쇼핑추천', '러닝화 추천해줘', {
      waitFor: (p) => chatPanel(p).locator('a[href^="/products/"]').first().waitFor({ timeout: LLM_WAIT }),
    });
    await shot(page, 'chat-shop', chatPanel(page));
  },

  'chat-personal': async () => {
    const page = await newPage({ auth: 'buyer' });
    await askChat(page, 'AI 쇼핑추천', '나에게 어울리는 상품 추천해줘', {
      waitFor: (p) => chatPanel(p).locator('a[href^="/products/"]').first().waitFor({ timeout: LLM_WAIT }),
    });
    await shot(page, 'chat-personal', chatPanel(page));
  },

  'image-search': async () => {
    const page = await newPage();
    await page.goto(`${WEB}/image-search`, { waitUntil: 'networkidle' });
    await page.setInputFiles('#image-upload', path.join(QUERY, 'query_sneaker.jpg'));
    await page.getByRole('button', { name: /유사 상품 검색/ }).click();
    await page.getByText(/유사한 상품 \d+개를 찾았어요/).waitFor({ timeout: 120_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await shot(page, 'image-search');
    await page.screenshot({ path: path.join(SHOTS, 'image-search-full.png'), fullPage: true });
  },

  'gift': async () => {
    const page = await newPage();
    await page.goto(`${WEB}/gift-wizard`, { waitUntil: 'networkidle' });
    await shot(page, 'gift-intro');
    await page.getByRole('button', { name: '추천 시작하기 →' }).click();
    const answers = ['부모', '50대+', '모던', '운동', '생일', '10~30만원', '실용적인 것'];
    for (const a of answers) {
      const btn = page.getByRole('button', { name: a, exact: true });
      await btn.waitFor();
      await btn.click();
      await page.waitForTimeout(900);
    }
    await page.getByText('AI가 선물을 분석하고 있어요').waitFor({ timeout: 30_000 });
    await page.waitForTimeout(2500);
    await shot(page, 'gift-loading');
    log('  … 선물 추천 응답 대기 (LLM JSON)');
    await page.getByText(/선물 3가지를 찾았어요/).waitFor({ timeout: LLM_WAIT });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await shot(page, 'gift-result');
    await page.screenshot({ path: path.join(SHOTS, 'gift-result-full.png'), fullPage: true });
  },

  'review-summary': async () => {
    const page = await newPage();
    const r = await page.request.get(`${API}/products/search?q=${encodeURIComponent('헤드폰')}`);
    const id = (await r.json()).products.find((p) => p.name.includes('노이즈캔슬링')).id;
    await page.goto(`${WEB}/products/${id}`, { waitUntil: 'networkidle' });
    const box = page.getByText('AI 리뷰 요약').first();
    await box.scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: '요약 생성' }).click();
    log('  … 리뷰 요약 응답 대기 (LLM)');
    await page.getByRole('button', { name: '요약 닫기' }).waitFor({ timeout: LLM_WAIT });
    await page.waitForTimeout(1000);
    await box.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
    await page.waitForTimeout(500);
    await shot(page, 'review-summary');
    await page.screenshot({ path: path.join(SHOTS, 'review-summary-full.png'), fullPage: true });
    // 슬라이드용: 요약 상자만, 좁은 폭에서 다시 배치해 글씨가 크게 보이게
    await page.setViewportSize({ width: 1060, height: 1400 });
    await page.waitForTimeout(800);
    const summaryBox = page.locator('div', { has: page.getByText('AI 리뷰 요약') })
      .filter({ has: page.getByText('구매 시 참고사항') }).last();
    await summaryBox.scrollIntoViewIfNeeded();
    await shot(page, 'review-summary-box', summaryBox);
  },

  // 대표 이미지: 홈 화면 위에서 AI 챗이 규정 문서를 근거로 답한 장면 (패널을 늘리지 않고 화면 그대로)
  'hero': async () => {
    const page = await newPage({ auth: 'buyer' });
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.locator('button.fixed.bottom-6.right-6').click();
    await page.getByRole('button', { name: /AI 규정문서/ }).click();
    await page.getByPlaceholder('메시지 입력...').fill('단순 변심으로 반품하면 배송비는 얼마야?');
    await page.getByPlaceholder('메시지 입력...').press('Enter');
    await page.getByText('참고:').waitFor({ timeout: LLM_WAIT });
    await page.waitForFunction(() => !document.querySelector('.animate-bounce'), null, { timeout: LLM_WAIT });
    await page.waitForTimeout(1200);
    await shot(page, 'hero');
  },

  // 개인화 답변을 스트리밍 도중에 캡처 — 말풍선이 잘리지 않은 상태로 두 번
  //   personal-first : 질문 + 답변 첫 문단까지
  //   personal-block : 첫 문단 + 첫 번째 추천 상품 블록까지 (환각 증거)
  'personal-stream': async () => {
    const page = await newPage({ auth: 'buyer' });
    await page.setViewportSize({ width: 1440, height: 1600 });
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.locator('button.fixed.bottom-6.right-6').click();
    await chatPanel(page).evaluate((el) => { el.style.height = '1440px'; });
    // 생성이 빨라 한 번에 도착하므로, 받은 SSE 이벤트를 하나씩 천천히 화면에 넘겨 스트리밍 중간 상태를 잡습니다 (내용은 그대로)
    await page.evaluate(() => {
      const orig = window.fetch;
      window.fetch = async (...args) => {
        const res = await orig(...args);
        if (!String(args[0]).includes('/chat/smart') || !res.body) return res;
        const reader = res.body.getReader();
        const enc = new TextEncoder(), dec = new TextDecoder();
        let buf = '';
        const stream = new ReadableStream({
          async start(ctrl) {
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              let i;
              while ((i = buf.indexOf('\n\n')) >= 0) {
                ctrl.enqueue(enc.encode(buf.slice(0, i + 2)));
                buf = buf.slice(i + 2);
                await new Promise((r) => setTimeout(r, 35));
              }
            }
            if (buf) ctrl.enqueue(enc.encode(buf));
            ctrl.close();
          },
        });
        return new Response(stream, { status: res.status, headers: res.headers });
      };
    });
    await page.getByRole('button', { name: /AI 쇼핑추천/ }).click();
    await page.getByPlaceholder('메시지 입력...').fill('나에게 어울리는 상품 추천해줘');
    await page.getByPlaceholder('메시지 입력...').press('Enter');
    log('  … 개인화 답변 스트리밍 대기');

    const SEL = 'div.fixed.bottom-24.right-6 div.rounded-2xl';
    const aiText = () => page.evaluate((sel) => {
      const b = [...document.querySelectorAll(sel)].filter((e) => e.className.includes('bg-gray-100')).pop();
      return b ? b.innerText : '';
    }, SEL);
    const clipShot = async (file) => page.evaluate((sel) => {
      const all = [...document.querySelectorAll(sel)];
      const u = all.filter((e) => e.className.includes('bg-gray-900')).pop();
      const a = all.filter((e) => e.className.includes('bg-gray-100')).pop();
      const panel = document.querySelector('div.fixed.bottom-24.right-6').getBoundingClientRect();
      const ru = u.getBoundingClientRect(), ra = a.getBoundingClientRect();
      // 첫 번째 번호 줄(상품명) 위치
      let mark = null;
      const p = a.querySelector('p'), tn = p.firstChild;
      if (tn && tn.nodeType === 3) {
        const t = tn.textContent, m = /(^|\n)\s*1\.\s[^\n]+/.exec(t);
        if (m) {
          const r = document.createRange();
          r.setStart(tn, m.index + m[1].length); r.setEnd(tn, m.index + m[0].length);
          const rr = r.getBoundingClientRect(); mark = { x: rr.x, y: rr.y, w: rr.width, h: rr.height };
        }
      }
      return { panel: { x: panel.x, w: panel.width }, user: { y: ru.y }, ai: { x: ra.x, y: ra.y, w: ra.width, h: ra.height }, mark };
    }, SEL).then(async (g) => {
      const clip = { x: g.panel.x + 1, y: g.user.y - 14, width: g.panel.w - 2, height: g.ai.y + g.ai.h + 14 - (g.user.y - 14) };
      await page.screenshot({ path: path.join(SHOTS, `${file}.png`), clip });
      return { clip, ...g };
    });

    const meta = {};
    await page.waitForFunction((sel) => {
      const b = [...document.querySelectorAll(sel)].filter((e) => e.className.includes('bg-gray-100')).pop();
      return b && /\S\n\s*\n\s*\S/.test(b.innerText);
    }, SEL, { timeout: LLM_WAIT, polling: 120 });
    meta.first = { ...(await clipShot('personal-first')), text: await aiText() };
    log('✓ personal-first.png');

    await page.waitForFunction((sel) => {
      const b = [...document.querySelectorAll(sel)].filter((e) => e.className.includes('bg-gray-100')).pop();
      const t = b ? b.innerText : '';
      const i = t.search(/(^|\n)\s*1\.\s/);
      return i >= 0 && /\n\s*\n/.test(t.slice(i + 3));
    }, SEL, { timeout: LLM_WAIT, polling: 120 });
    meta.block = { ...(await clipShot('personal-block')), text: await aiText() };
    log('✓ personal-block.png');

    await page.waitForFunction(() => !document.querySelector('.animate-bounce'), null, { timeout: LLM_WAIT });
    await page.waitForTimeout(1200);
    meta.final = await aiText();
    meta.cards = await chatPanel(page).locator('a[href^="/products/"] h4').allInnerTexts();
    fs.writeFileSync(path.join(SHOTS, 'personal-stream.json'), JSON.stringify(meta, null, 2));
    log(`  카드: ${meta.cards.join(', ')}`);
  },

  // 채팅 창 그대로 (헤더 · 질문 · 답변 시작 · 입력창) — 잘린 말풍선이 아니라 실제 창 모양
  'widgets': async () => {
    const run = async (name, auth, mode, q) => {
      const page = await newPage(auth ? { auth } : {});
      await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
      await page.locator('button.fixed.bottom-6.right-6').click();
      await page.getByRole('button', { name: new RegExp(mode) }).click();
      await page.getByPlaceholder('메시지 입력...').fill(q);
      await page.getByPlaceholder('메시지 입력...').press('Enter');
      log(`  … "${q}" 응답 대기`);
      await page.waitForFunction(() => !document.querySelector('.animate-bounce') &&
        [...document.querySelectorAll('div.fixed.bottom-24.right-6 div.rounded-2xl')].some((e) => e.className.includes('bg-gray-100')),
      null, { timeout: LLM_WAIT });
      await page.waitForTimeout(1500);
      await chatPanel(page).evaluate((el) => el.querySelectorAll('.overflow-y-auto').forEach((s) => (s.scrollTop = 0)));
      await page.waitForTimeout(400);
      await shot(page, name, chatPanel(page));
      return page;
    };
    await run('widget-personal', 'buyer', 'AI 쇼핑추천', '나에게 어울리는 상품 추천해줘');
    const p2 = await run('widget-shop', null, 'AI 쇼핑추천', '러닝화 추천해줘');
    // 쇼핑 추천은 답변 끝 + 상품 카드가 보이게 맨 아래로
    await chatPanel(p2).evaluate((el) => el.querySelectorAll('.overflow-y-auto').forEach((s) => (s.scrollTop = s.scrollHeight)));
    await p2.waitForTimeout(400);
    await shot(p2, 'widget-shop-end', chatPanel(p2));
  },

  // RAG 에이전트 모드 — 도구 호출 과정 + 검증 + 답변 + 상품 카드
  'agent': async () => {
    const run = async (name, auth, q) => {
      const page = await newPage(auth ? { auth } : {});
      // 같은 실행의 SSE 이벤트 도착 시각 기록 (트레이스) — 화면 동작은 그대로
      await page.addInitScript(() => {
        const orig = window.fetch;
        window.__trace = [];
        window.fetch = async (...args) => {
          const t0 = performance.now();
          const res = await orig(...args);
          if (!String(args[0]).includes('/agent/chat') || !res.body) return res;
          const [a, b] = res.body.tee();
          (async () => {
            const reader = b.getReader(); const dec = new TextDecoder(); let buf = '';
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              let i;
              while ((i = buf.indexOf('\n\n')) >= 0) {
                const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
                if (line.startsWith('data: ')) {
                  try { window.__trace.push({ t: Math.round(performance.now() - t0), ...JSON.parse(line.slice(6)) }); } catch {}
                }
              }
            }
          })();
          return new Response(a, { status: res.status, headers: res.headers });
        };
      });
      await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
      await page.locator('button.fixed.bottom-6.right-6').click();
      await shot(page, 'agent-modes', chatPanel(page));
      await page.getByRole('button', { name: /AI 에이전트/ }).click();
      await page.getByPlaceholder('메시지 입력...').fill(q);
      await page.getByPlaceholder('메시지 입력...').press('Enter');
      log(`  … "${q}" 에이전트 응답 대기`);
      await page.waitForFunction(() => !document.querySelector('.animate-bounce') &&
        [...document.querySelectorAll('div.fixed.bottom-24.right-6 div.rounded-2xl')].some((e) => e.className.includes('bg-gray-100')),
      null, { timeout: LLM_WAIT });
      await page.waitForTimeout(1500);
      // 대화 전체가 보이게 패널을 내용 높이만큼
      const panel = chatPanel(page);
      const need = await panel.evaluate((el) => {
        const sc = [...el.querySelectorAll('.overflow-y-auto')].sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
        return sc ? el.offsetHeight - sc.clientHeight + sc.scrollHeight + 4 : el.offsetHeight;
      });
      if (need > 700) {
        await page.setViewportSize({ width: 1440, height: need + 140 });
        await panel.evaluate((el, h) => { el.style.height = `${h}px`; }, need);
      }
      await panel.evaluate((el) => el.querySelectorAll('.overflow-y-auto').forEach((s) => (s.scrollTop = 0)));
      await page.waitForTimeout(400);
      await shot(page, name, panel);
      // 슬라이드 번호 표시용 — 마지막 AI 답변의 요소 위치 (패널 기준 CSS px)
      const boxes = await panel.evaluate((el) => {
        const P = el.getBoundingClientRect();
        const r = (n) => { if (!n) return null; const b = n.getBoundingClientRect(); return [b.left - P.left, b.top - P.top, b.width, b.height].map(Math.round); };
        const msg = [...el.querySelectorAll('div.flex.flex-col.items-start')].pop();
        const lines = msg ? [...msg.querySelectorAll('div.rounded-lg.border > div')] : [];
        const text = (d) => d?.querySelector('span:last-child');
        const src = msg && [...msg.querySelectorAll('span')].find((s) => s.textContent === '참고:')?.parentElement;
        return {
          w: Math.round(P.width), h: Math.round(P.height),
          call: r(text(lines.find((d) => d.className.includes('font-medium')))),
          result: r(text(lines.find((d) => d.className.includes('pl-4')))),
          verify: r(text(lines.filter((d) => /green|amber/.test(d.className)).pop())),
          answer: r(msg?.querySelector('div.rounded-2xl')),
          sources: r(src?.lastElementChild), sourcesRow: r(src),
          product: r(msg?.querySelector('a.rounded-lg')),
          products: r(msg?.querySelector('div.space-y-2')),
        };
      });
      fs.writeFileSync(path.join(SHOTS, `${name}.boxes.json`), JSON.stringify(boxes, null, 2));
      const trace = await page.evaluate(() => window.__trace);
      fs.writeFileSync(path.join(SHOTS, `${name}.trace.json`), JSON.stringify(trace, null, 2));
      log(`  트레이스 ${trace.length}개 이벤트 · ${trace.map((e) => e.type).join(' → ')}`);
    };
    await run('agent-multi', null, '러닝화 15만원 이하로 추천해주고, 단순 변심으로 반품하면 배송비는 얼마야?');
    await run('agent-order', 'buyer', '주문한 이어버드 배송 상태랑 반품 신청 기한 알려줘');
  },

  // 실행 에이전트: 추천 → "첫 번째 거 장바구니에 담아줘" → 실행 전 확인 카드 → [실행] → 결과
  //   먼저 local-env/reset_actions.py 로 장바구니를 비워 둠
  'agent-action': async () => {
    const page = await newPage({ auth: 'buyer' });
    const panel = chatPanel(page);
    const bubbles = () => panel.locator('div.rounded-2xl.bg-gray-100').count();
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.locator('button.fixed.bottom-6.right-6').click();
    await page.getByRole('button', { name: /AI 에이전트/ }).click();
    const settle = async () => {
      await page.waitForTimeout(1200);
      const need = await panel.evaluate((el) => {
        const sc = [...el.querySelectorAll('.overflow-y-auto')].sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
        return sc ? el.offsetHeight - sc.clientHeight + sc.scrollHeight + 4 : el.offsetHeight;
      });
      if (need > 700) {
        await page.setViewportSize({ width: 1440, height: need + 140 });
        await panel.evaluate((el, h) => { el.style.height = `${h}px`; }, need);
      }
      await panel.evaluate((el) => el.querySelectorAll('.overflow-y-auto').forEach((s) => (s.scrollTop = 0)));
      await page.waitForTimeout(400);
    };
    const ask = async (q, until) => {
      const n = await bubbles();
      await page.getByPlaceholder('메시지 입력...').fill(q);
      await page.getByPlaceholder('메시지 입력...').press('Enter');
      log(`  … "${q}" 에이전트 응답 대기`);
      await page.waitForFunction(until, n, { timeout: LLM_WAIT });
    };
    const confirmShown = () => [...document.querySelectorAll('div.fixed.bottom-24.right-6 p')].some((p) => p.textContent === '실행 전 확인')
      && !document.querySelector('.animate-bounce');
    // 슬라이드 번호 표시용 — 요소 위치 (패널 기준 px)
    const boxes = (name) => panel.evaluate((el) => {
      const P = el.getBoundingClientRect();
      const r = (n) => { if (!n) return null; const b = n.getBoundingClientRect(); return [b.left - P.left, b.top - P.top, b.width, b.height].map(Math.round); };
      const users = [...el.querySelectorAll('div.flex.flex-col.items-end div.rounded-2xl')];
      const lines = [...el.querySelectorAll('div.rounded-lg.border > div')];
      const find = (re) => lines.filter((d) => re.test(d.textContent)).pop();
      return {
        w: Math.round(P.width), h: Math.round(P.height),
        ask: r(users[users.length - 1]),
        call: r(find(/장바구니 담기 · P\d/)?.querySelector('span:last-child')),
        wait: r(find(/고객 확인 대기/)?.querySelector('span:last-child')),
        // 확인 카드 = '실행 전 확인' 제목을 가진 상자 (헤더의 접속 표시 점도 border-2 라 클래스로 찾지 않음)
        confirm: r([...el.querySelectorAll('p')].find((p) => p.textContent === '실행 전 확인')?.parentElement),
        buttons: r([...el.querySelectorAll('p')].find((p) => p.textContent === '실행 전 확인')?.parentElement.querySelector('div.flex')),
        action: r(find(/실행 완료|취소함/)?.querySelector('span:last-child')),
        answer: r([...el.querySelectorAll('div.rounded-2xl.bg-gray-100')].pop()),
      };
    }).then((b) => fs.writeFileSync(path.join(SHOTS, `${name}.boxes.json`), JSON.stringify(b, null, 2)));

    await ask('러닝화 15만원 이하로 추천해줘', (n) => !document.querySelector('.animate-bounce')
      && document.querySelectorAll('div.fixed.bottom-24.right-6 div.rounded-2xl.bg-gray-100').length > n);
    await ask('첫 번째 거 장바구니에 담아줘', confirmShown);
    await settle();
    await shot(page, 'agent-confirm', panel);
    await boxes('agent-confirm');
    const n = await bubbles();
    await panel.getByRole('button', { name: '실행', exact: true }).click();
    log('  … 승인 후 실행 · 답변 대기');
    await page.waitForFunction((n) => !document.querySelector('.animate-bounce')
      && document.querySelectorAll('div.fixed.bottom-24.right-6 div.rounded-2xl.bg-gray-100').length > n, n, { timeout: LLM_WAIT });
    await settle();
    await shot(page, 'agent-action', panel);
    await boxes('agent-action');
  },

  // 표지용: 쇼핑몰 홈 위에서 에이전트가 복합 질문에 답한 장면 (창 크기 그대로)
  'agent-hero': async () => {
    const page = await newPage({ auth: 'buyer' });
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.locator('button.fixed.bottom-6.right-6').click();
    await page.getByRole('button', { name: /AI 에이전트/ }).click();
    await page.getByPlaceholder('메시지 입력...').fill('러닝화 15만원 이하로 추천해주고, 단순 변심으로 반품하면 배송비는 얼마야?');
    await page.getByPlaceholder('메시지 입력...').press('Enter');
    log('  … 표지용 에이전트 응답 대기');
    await page.waitForFunction(() => !document.querySelector('.animate-bounce') &&
      [...document.querySelectorAll('div.fixed.bottom-24.right-6 div.rounded-2xl')].some((e) => e.className.includes('bg-gray-100')),
    null, { timeout: LLM_WAIT });
    await page.waitForTimeout(1500);
    await chatPanel(page).evaluate((el) => el.querySelectorAll('.overflow-y-auto').forEach((s) => (s.scrollTop = 0)));
    await page.waitForTimeout(400);
    await shot(page, 'agent-hero');
  },

  // 리뷰 요약 상자를 좁은 화면에서 — 글씨가 상대적으로 크게
  'review-narrow': async () => {
    const page = await newPage();
    await page.setViewportSize({ width: 640, height: 1400 });
    const r = await page.request.get(`${API}/products/search?q=${encodeURIComponent('헤드폰')}`);
    const id = (await r.json()).products.find((p) => p.name.includes('노이즈캔슬링')).id;
    await page.goto(`${WEB}/products/${id}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '요약 생성' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: '요약 생성' }).click();
    log('  … 리뷰 요약 응답 대기 (LLM)');
    await page.getByRole('button', { name: '요약 닫기' }).waitFor({ timeout: LLM_WAIT });
    await page.waitForTimeout(800);
    const box = page.locator('div', { has: page.getByText('AI 리뷰 요약') })
      .filter({ has: page.getByText('구매 시 참고사항') }).last();
    await box.scrollIntoViewIfNeeded();
    await shot(page, 'review-narrow', box);
  },

  'gift-step': async () => {
    const page = await newPage();
    await page.goto(`${WEB}/gift-wizard`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '추천 시작하기 →' }).click();
    await page.getByRole('button', { name: '부모', exact: true }).waitFor();
    await page.waitForTimeout(800);
    await shot(page, 'gift-step1');
    for (const a of ['부모', '50대+']) {
      await page.getByRole('button', { name: a, exact: true }).click();
      await page.waitForTimeout(900);
    }
    await page.getByRole('button', { name: '모던', exact: true }).waitFor();
    await page.waitForTimeout(600);
    await shot(page, 'gift-step3');
  },

  'product': async () => {
    const page = await newPage();
    const r = await page.request.get(`${API}/products/search?q=${encodeURIComponent('헤드폰')}`);
    const id = (await r.json()).products.find((p) => p.name.includes('노이즈캔슬링')).id;
    await page.goto(`${WEB}/products/${id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot(page, 'product');
  },

  'home': async () => {
    const page = await newPage({ auth: 'buyer' });
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await shot(page, 'home');
  },
};

for (const [name, fn] of Object.entries(jobs)) {
  if (!want(name)) continue;
  log(`▶ ${name}`);
  try {
    await fn();
  } catch (e) {
    log(`✗ ${name}: ${e.message.split('\n')[0]}`);
  }
}
await browser.close();
