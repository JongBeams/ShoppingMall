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

const browser = await chromium.launch();

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
