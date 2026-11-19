// =====================================================================
// 도식 (SVG) — 시스템 구성 · 기술 구조 · 에이전트 그래프 · 보안 경로 · 요약 그림
//   역할 색: LLM(주황) · 코드/시스템(파랑) · 고객(초록) — 모든 도식에서 같은 뜻
//   글자는 foreignObject(HTML)로 넣어 줄바꿈 · 서체를 본문과 맞춤
// =====================================================================

// ---- 선 아이콘 (24 × 24)
export const IC = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21 q8 -12 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20 q6.5 -11 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M15 14.5 q5 -2 7 5"/>',
  chat: '<path d="M3 4 h18 v12 h-10 l-5 4 v-4 h-3 z"/><path d="M7 8.5 h10 M7 11.8 h6"/>',
  dots: '<path d="M3 4 h18 v12 h-10 l-5 4 v-4 h-3 z"/><path d="M8 10 h.3 M12 10 h.3 M16 10 h.3"/>',
  key: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8 L20 3 M16.5 6.5 l2.5 2.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11 V7.5 a4 4 0 0 1 8 0 V11"/>',
  shield: '<path d="M12 2 L20 5 V11 C20 16 16.5 19.5 12 22 C7.5 19.5 4 16 4 11 V5 Z"/><path d="M8.5 12 l2.5 2.5 l4.5 -5"/>',
  doc: '<path d="M6 2 h9 l5 5 v15 h-14 z M15 2 v5 h5 M9 12 h7 M9 16 h7"/>',
  docs: '<path d="M8 2 h8 l4 4 v12 h-12 z M4 6 v16 h12"/>',
  db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5 v14 q8 6 16 0 v-14 M4 12 q8 6 16 0"/>',
  vec: '<path d="M3 3 V21 H21"/><circle cx="8" cy="15" r="1.4"/><circle cx="11" cy="9" r="1.4"/><circle cx="16" cy="13" r="1.4"/><circle cx="18" cy="6" r="1.4"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2 v4 M15 2 v4 M9 18 v4 M15 18 v4 M2 9 h4 M2 15 h4 M18 9 h4 M18 15 h4"/>',
  gpu: '<rect x="2" y="6" width="20" height="12" rx="1.5"/><circle cx="9" cy="12" r="3.2"/><path d="M15 9.5 h4 M15 12 h4 M15 14.5 h4"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/><path d="M7 6.5 h.5 M7 17.5 h.5"/>',
  monitor: '<rect x="2" y="3" width="20" height="13" rx="1.5"/><path d="M8 21 h8 M12 16 v5"/>',
  cart: '<path d="M2 3 h3 l2.5 12 h11 l2 -8 h-14.5"/><circle cx="9" cy="19.5" r="1.6"/><circle cx="17" cy="19.5" r="1.6"/>',
  box: '<path d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z M12 12 L21 7 M12 12 V22 M12 12 L3 7"/>',
  xcirc: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5 L15.5 15.5 M15.5 8.5 L8.5 15.5"/>',
  headset: '<path d="M4 14 v-2 a8 8 0 0 1 16 0 v2"/><rect x="3" y="13" width="4" height="6" rx="1"/><rect x="17" y="13" width="4" height="6" rx="1"/><path d="M19 19 q0 3 -5 3 h-2"/>',
  search: '<circle cx="10" cy="10" r="6.5"/><path d="M15 15 L21 21"/>',
  ccheck: '<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5 l3 3 l6 -6.5"/>',
  cycle: '<path d="M20 12 a8 8 0 0 1 -14 5.3 M4 12 a8 8 0 0 1 14 -5.3"/><path d="M18 3 v4 h-4 M6 21 v-4 h4"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5 v7 M14 8.5 v7"/>',
  layers: '<path d="M12 3 L22 8 L12 13 L2 8 Z M2 12.5 L12 17.5 L22 12.5 M2 17 L12 22 L22 17"/>',
  tag: '<path d="M3 3 h8 l10 10 l-8 8 l-10 -10 z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  hash: '<path d="M9.5 3 L7.5 21 M16.5 3 L14.5 21 M4 9 h17 M3 15 h17"/>',
  filter: '<path d="M3 4 h18 l-7 8.5 v6.5 l-4 2 v-8.5 z"/>',
  link: '<path d="M10 14 a4 4 0 0 0 5.7 0 l3 -3 a4 4 0 0 0 -5.7 -5.7 l-1 1 M14 10 a4 4 0 0 0 -5.7 0 l-3 3 a4 4 0 0 0 5.7 5.7 l1 -1"/>',
  alert: '<path d="M12 3 L22 20 H2 Z M12 9.5 v5 M12 17 v.6"/>',
  eyeNo: '<path d="M2 12 q10 -11 20 0 q-10 11 -20 0 z"/><circle cx="12" cy="12" r="3"/><path d="M4 4 L20 20"/>',
  cloudNo: '<path d="M7 18 h10 a4 4 0 0 0 0 -8 a6 6 0 0 0 -11.5 1.5 a3.3 3.3 0 0 0 1.5 6.5 z"/><path d="M4 3 L20 21"/>',
  code: '<path d="M8 7 L3 12 L8 17 M16 7 L21 12 L16 17 M14 4 L10 20"/>',
  braces: '<path d="M8 3 q-3 0 -3 3 v3 q0 3 -2.5 3 q2.5 0 2.5 3 v3 q0 3 3 3 M16 3 q3 0 3 3 v3 q0 3 2.5 3 q-2.5 0 -2.5 3 v3 q0 3 -3 3"/>',
  lang: '<path d="M2.5 5 h10 M7.5 3 v2 M4.5 5 q1 5.5 7 8.5 M10.5 5 q-1 5.5 -7 8.5"/><path d="M12.5 21 l4.5 -11 l4.5 11 M14.2 17 h5.6"/>',
  scale: '<path d="M12 3 v17 M7 20.5 h10 M5 6.5 h14"/><path d="M5 6.5 l-3 6.5 h6 z M19 6.5 l-3 6.5 h6 z"/>',
  wrench: '<path d="M14.5 3.5 a5 5 0 0 0 -4.6 6.8 L3.5 16.7 a2 2 0 0 0 2.8 2.8 L12.7 13.1 a5 5 0 0 0 6.8 -4.6 l-3 3 l-3 -1 l-1 -3 z"/>',
  upload: '<path d="M12 16 V4 M7 9 L12 4 L17 9 M4 16 v4 h16 v-4"/>',
  text: '<path d="M4 5 h16 M12 5 v15 M8 20 h8"/>',
  blocks: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5 L20 18 M8.5 16.5 L20 6"/>',
  save: '<path d="M4 3 h13 l3 3 v15 h-16 z M8 3 v5 h7 v-5 M7 13 h10 v8 h-10 z"/>',
  play: '<path d="M7 4 L19 12 L7 20 Z"/>',
  flask: '<path d="M9 3 h6 M10 3 v6 L4 20 h16 L14 9 V3"/><path d="M7 15 h10"/>',
  gauge: '<path d="M3 17 a9 9 0 0 1 18 0"/><path d="M12 17 L16 10"/><path d="M3 21 h18"/>',
  repeat: '<path d="M4 9 a8 8 0 0 1 14 -3 l2 2 M20 15 a8 8 0 0 1 -14 3 l-2 -2"/><path d="M20 3 v5 h-5 M4 21 v-5 h5"/>',
  memo: '<path d="M4 4 h16 v16 h-16 z M8 9 h8 M8 13 h8 M8 17 h5"/>',
  route: '<circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M7 6 h7 a4 4 0 0 1 0 8 h-4 a4 4 0 0 0 0 8 h7"/>',
};
export const icon = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24">${IC[name] || ''}</svg>`;
const ic = (name, x, y, s = 1, cls = '') => `<g class="ic ${cls}" transform="translate(${x} ${y}) scale(${s})">${IC[name]}</g>`;
const fo = (x, y, w, h, html, cls = '') =>
  `<foreignObject x="${x}" y="${y}" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="fo ${cls}">${html}</div></foreignObject>`;
const ROLE_C = { sys: 'var(--sys)', llm: 'var(--llm)', cust: 'var(--cust)', out: 'var(--out)', store: 'var(--store)' };
const markers = (p) => Object.entries(ROLE_C).map(([r, c]) =>
  `<marker id="${p}-${r}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" style="fill:${c}"/></marker>`).join('');
const lane = (p, d, role, dash = false) => `<path class="lane ${role}${dash ? ' dash' : ''}" d="${d}" marker-end="url(#${p}-${role})"/>`;
const lt = (x, y, text, cls = '') => `<text class="lt ${cls}" x="${x}" y="${y}">${text}</text>`;
const legendSvg = (x, y) => [['llm', 'LLM'], ['sys', '코드 · 시스템'], ['cust', '고객']]
  .map(([r, n], i) => { const xx = x + [0, 64, 178][i]; return `<rect x="${xx}" y="${y}" width="12" height="12" style="fill:${ROLE_C[r]}"/><text class="lt" x="${xx + 17}" y="${y + 10.5}">${n}</text>`; }).join('');
export const legend = () => `<div class="lgd"><span><i style="background:var(--llm)"></i>LLM</span><span><i style="background:var(--sys)"></i>코드 · 시스템</span><span><i style="background:var(--cust)"></i>고객</span></div>`;

// =====================================================================
// 1. 시스템 구성 — 질문 하나가 지나는 6단계 (단계마다 작은 그림)
// =====================================================================
const AW = 1160, AH = 468;
const CX = [20, 194, 368, 542, 716, 890], CW = 150, CY = 102, CH = 202;
const WHO = { sys: '시스템', llm: 'LLM', cust: '고객' };
const ILL = [
  // 1 질문 · 고객 확인: 채팅 창 + 질문 + JWT
  `<rect class="il-w" x="10" y="8" width="130" height="84" rx="4"/><path class="il-ln" d="M10 21 H140"/>
   <circle class="il-dot" cx="18" cy="14.5" r="2"/><circle class="il-dot" cx="25" cy="14.5" r="2"/><circle class="il-dot" cx="32" cy="14.5" r="2"/>
   <rect class="il-tag" x="54" y="28" width="78" height="20" rx="3"/><text class="il-tw" x="93" y="41.5">러닝화 추천해줘</text>
   <rect class="il-bar" x="18" y="53" width="64" height="5"/><rect class="il-bar" x="18" y="62" width="48" height="5"/>
   <rect class="il-fill" x="18" y="72" width="32" height="14" rx="2"/><text class="il-tw" x="34" y="82">JWT</text>
   <text class="il-t" x="56" y="82.5">user_id 확인</text>`,
  // 2 도구 선택: 질문 → LLM → 도구 셋 중 둘을 고름
  `<rect class="il-k" x="4" y="36" width="34" height="26" rx="3"/><text class="il-tm" x="21" y="52.5">질문</text>
   <path class="il-role thin" d="M38 49 H48 M45 46 L48 49 L45 52"/>
   <rect class="il-tint" x="51" y="31" width="36" height="36" rx="5"/>
   <path class="il-role thin" d="M59 31 v-5 M69 31 v-5 M79 31 v-5 M59 67 v5 M69 67 v5 M79 67 v5"/>
   <text class="il-tr" x="69" y="53">LLM</text>
   <path class="il-role thin" d="M87 42 L99 21 M87 49 H99"/><path class="il-off" d="M87 56 L99 77"/>
   <rect class="il-sel" x="100" y="12" width="46" height="17" rx="2"/><text class="il-tm" x="123" y="23.8">상품 검색</text>
   <rect class="il-sel" x="100" y="41" width="46" height="17" rx="2"/><text class="il-tm" x="123" y="52.8">규정 검색</text>
   <rect class="il-nsel" x="100" y="70" width="46" height="17" rx="2"/><text class="il-tm off" x="123" y="81.8">주문 조회</text>`,
  // 3 도구 실행: 조회는 병렬로 결과, 실행 도구는 사전 검사만
  `<rect class="il-k" x="6" y="10" width="56" height="18" rx="2"/><text class="il-tm" x="34" y="22.5">상품 검색</text>
   <path class="il-role thin" d="M62 19 H72 M69 16 L72 19 L69 22"/>
   <rect class="il-tag" x="76" y="11" width="21" height="16"/><text class="il-tw" x="86.5" y="22.5">P1</text>
   <rect class="il-tag" x="100" y="11" width="21" height="16"/><text class="il-tw" x="110.5" y="22.5">P2</text>
   <rect class="il-tag" x="124" y="11" width="21" height="16"/><text class="il-tw" x="134.5" y="22.5">P3</text>
   <rect class="il-k" x="6" y="40" width="56" height="18" rx="2"/><text class="il-tm" x="34" y="52.5">규정 검색</text>
   <path class="il-role thin" d="M62 49 H72 M69 46 L72 49 L69 52"/>
   <text class="il-t" x="76" y="52.5">근거 3건 · 0.77</text>
   <rect class="il-nsel" x="6" y="70" width="56" height="18" rx="2"/><text class="il-tm" x="34" y="82.5">장바구니</text>
   <path class="il-role thin" d="M62 79 H72 M69 76 L72 79 L69 82"/>
   <text class="il-t" x="76" y="82.5">사전 검사만</text>`,
  // 4 실행 전 확인: 서버가 만든 확인 카드 + 고객
  `<rect class="il-w" x="6" y="6" width="116" height="80" rx="3"/><rect class="il-fill" x="6" y="6" width="116" height="4"/>
   <text class="il-tb" x="14" y="25">실행 전 확인</text>
   <text class="il-t" x="14" y="40">'러닝화 (레드)' 1개를</text>
   <text class="il-t" x="14" y="52">장바구니에 담습니다</text>
   <rect class="il-fill" x="14" y="62" width="48" height="16" rx="2"/><text class="il-tw" x="38" y="73.5">실행</text>
   <rect class="il-btn2" x="68" y="62" width="46" height="16" rx="2"/><text class="il-tm" x="91" y="73.5">취소</text>
   <circle class="il-person" cx="137" cy="62" r="5.5"/><path class="il-person" d="M128.5 86 q8.5 -17 17 0"/>`,
  // 5 답변 검증: 답변 초안 + 검사 목록 (하나 걸리면 재작성)
  `<rect class="il-w" x="6" y="8" width="84" height="84" rx="3"/>
   <rect class="il-tag" x="14" y="16" width="16" height="11"/><text class="il-tw" x="22" y="24.5" style="font-size:7.5px">P1</text>
   <rect class="il-bar" x="34" y="18" width="48" height="6"/><rect class="il-bar" x="14" y="34" width="68" height="6"/>
   <rect class="il-bar" x="14" y="48" width="60" height="6"/><rect class="il-bar" x="14" y="62" width="66" height="6"/><rect class="il-bar" x="14" y="76" width="40" height="6"/>
   <text class="il-t" x="98" y="21">번호</text><circle class="il-ok" cx="140" cy="18" r="5"/>
   <text class="il-t" x="98" y="41">수치</text><circle class="il-ok" cx="140" cy="38" r="5"/>
   <text class="il-t" x="98" y="61">언어</text><circle class="il-ok" cx="140" cy="58" r="5"/>
   <text class="il-t" x="98" y="81">누락</text><path class="il-no" d="M136 74 L144 82 M144 74 L136 82"/>`,
  // 6 답변 · 카드: [P1] → DB 상품명, 상품 카드
  `<rect class="il-tag" x="8" y="12" width="24" height="17"/><text class="il-tw" x="20" y="24">P1</text>
   <path class="il-role thin" d="M35 20.5 H47 M44 17.5 L47 20.5 L44 23.5"/>
   <text class="il-tb" x="51" y="24.5">'러닝화 (레드)'</text>
   <rect class="il-w" x="8" y="38" width="134" height="46" rx="3"/><rect class="il-img" x="14" y="44" width="34" height="34"/>
   <text class="il-tb" x="56" y="57">러닝화 (레드)</text><text class="il-t" x="56" y="73" style="font-weight:800;fill:var(--ink)">119,000원</text>
   <text class="il-t" x="112" y="73">★ 4.0</text>
   <text class="il-t" x="8" y="97">참고 문서 · 출처 표시</text>`,
];

const stepTile = (i, role, title, line, key = false) => {
  const x = CX[i];
  return `<g class="r-${role}${key ? ' key' : ''}"><rect class="tile" x="${x}" y="${CY}" width="${CW}" height="${CH}"/>` +
    `<rect class="tile-h" x="${x + 0.5}" y="${CY + 0.5}" width="${CW - 1}" height="26"/><rect class="tile-bar" x="${x}" y="${CY}" width="${CW}" height="3"/>` +
    `<circle class="num" cx="${x + 16}" cy="${CY + 14}" r="9"/><text class="num-t" x="${x + 16}" y="${CY + 18}">${i + 1}</text>` +
    `<text class="who" x="${x + 31}" y="${CY + 18.5}">${WHO[role]}</text>` +
    `<rect class="ilbg" x="${x + 1}" y="${CY + 27}" width="${CW - 2}" height="102"/>` +
    `<g transform="translate(${x} ${CY + 28})">${ILL[i]}</g></g>` +
    fo(x + 8, CY + 134, CW - 14, CH - 136, `<b>${title}</b><p>${line}</p>`, 'st');
};
const gapC = (i, cyc = false) => {
  const cx = CX[i] + CW + 12, cy = CY + 78;
  return `<g class="gapc"><circle cx="${cx}" cy="${cy}" r="9.5"/>` +
    (cyc ? `<path d="M${cx - 4.5} ${cy - 2} h9 M${cx + 2} ${cy - 5} l3 3 l-3 3 M${cx + 4.5} ${cy + 3} h-9 M${cx - 2} ${cy} l-3 3 l3 3" style="stroke-width:1.2"/>`
      : `<path d="M${cx - 2} ${cy - 4} L${cx + 2.5} ${cy} L${cx - 2} ${cy + 4}"/>`) + '</g>';
};
const BASE_ICON = {
  model: `<rect class="bi" x="2" y="6" width="48" height="40" rx="3"/>` +
    [0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => `<rect class="bi-ai" x="${7.5 + c * 10.5}" y="${11.5 + r * 11}" width="8" height="8" rx="1"/>`)).join(''),
  db: `<path class="bi" d="M6 9 v32 a20 6 0 0 0 40 0 v-32"/><path class="bi-l" d="M6 20 a20 6 0 0 0 40 0 M6 31 a20 6 0 0 0 40 0"/><ellipse class="bi" cx="26" cy="9" rx="20" ry="6"/>`,
  ckpt: `<rect class="bi" x="10" y="4" width="36" height="12" rx="2"/><rect class="bi" x="6" y="20" width="36" height="12" rx="2"/><rect class="bi" x="2" y="36" width="36" height="12" rx="2"/>` +
    `<path class="bi-l" d="M8 40 v4 M12 40 v4" style="stroke:var(--cust);stroke-width:2"/><path class="bi-l" d="M42 42 h8 M46 38 l4 4 l-4 4"/>`,
  api: `<rect class="bi" x="2" y="4" width="22" height="20"/><rect class="bi" x="28" y="4" width="22" height="20"/><rect class="bi" x="2" y="28" width="22" height="20"/><rect class="bi" x="28" y="28" width="22" height="20"/>` +
    ic('cart', 7, 8, 0.5) + ic('box', 33, 8, 0.5) + ic('headset', 7, 32, 0.5) + ic('doc', 33, 32, 0.5),
};
const baseTile = (x, w, iconName, head, lines, cls = '') =>
  `<rect class="base ${cls}" x="${x}" y="356" width="${w}" height="98"/>` +
  `<g transform="translate(${x + 13} 379)">${BASE_ICON[iconName]}</g>` +
  fo(x + 78, 364, w - 84, 88, `<b>${head}</b>${lines.map((l) => `<p>${l}</p>`).join('')}`, `bt ${cls}`);

export function archSvg() {
  const P = 'ar';
  return `<svg class="d" width="${AW}" height="${AH}" viewBox="0 0 ${AW} ${AH}" xmlns="http://www.w3.org/2000/svg">
<defs>${markers(P)}</defs>
<g class="act">${ic('user', 22, 4, 1.05)}</g>
${fo(52, 1, 230, 40, '<b>고객 · 브라우저</b><p>AI 챗 위젯 · 로그인 토큰 (JWT)</p>', 'edge')}
${lane(P, 'M34 32 V93', 'cust')}
${legendSvg(452, 12)}
<g class="act no">${ic('cloudNo', 862, 4, 1.05)}</g>
${fo(894, 1, 266, 40, '<b>외부 LLM API</b><p>연결 없음 · 고객 · 주문 데이터 외부 전송 0</p>', 'edge')}
<path class="cut" d="M875 50 V32"/>

<rect class="frame" x="8" y="50" width="1046" height="414" rx="3"/>
<rect class="frame-bg" x="118" y="42" width="358" height="16"/>
<text class="frame-t" x="126" y="54.5">서버 (FastAPI + LangGraph) · 로컬 GPU PC 한 대</text>

${lane(P, `M${CX[4] + 92} ${CY} V70 H${CX[1] + 52} V${CY - 2}`, 'llm', true)}
${lt(CX[2] + 58, 66, '검증 실패 → 다시 작성 (1회, 빠진 도구는 확정 호출)', 'llm')}
${lane(P, `M${CX[2] + 112} ${CY} V87 H${CX[4] + 30} V${CY - 2}`, 'sys')}
${lt(CX[3] + 2, 83, '실행 도구가 없으면 확인 없이 검증', 'sys')}

${stepTile(0, 'sys', '질문 · 고객 확인', '토큰으로 고객 확인 · 대화 주인 검사 · 권한별 도구')}
${stepTile(1, 'llm', '도구 선택', 'qwen2.5:14b가 도구 7개 중 골라 인자 작성', true)}
${stepTile(2, 'sys', '도구 실행', '조회는 병렬 · 결과를 보고 ②로 (최대 4라운드)')}
${stepTile(3, 'cust', '실행 전 확인', '그래프가 멈춤 · 승인한 뒤에만 기존 API 실행', true)}
${stepTile(4, 'sys', '답변 검증', '검사 12가지 · 실패하면 다시 작성')}
${stepTile(5, 'sys', '답변 · 카드', '[P#] → DB 상품명 · 가격 · 출처')}
${gapC(0)}${gapC(1, true)}${gapC(2)}${gapC(3)}${gapC(4)}

${lane(P, `M${CX[5] + CW} 176 H1080`, 'sys')}
<g class="act">${ic('monitor', 1092, 160, 1.15)}</g>
${fo(1058, 192, 102, 54, '<b>고객 화면</b><p>답변 · 출처 · 상품 카드 (SSE)</p>', 'edge c')}

<text class="zone" x="20" y="344">기반: 모델 · 데이터 · 대화 상태</text>
${lane(P, `M${CX[1] + 36} 356 V${CY + CH + 2}`, 'llm')}
${lt(CX[1] + 44, 330, '생성', 'llm')}
${lane(P, `M${CX[2] + 75} 356 V${CY + CH + 2}`, 'sys')}
${lt(CX[2] + 83, 330, '조회 · 벡터 검색', 'sys')}
${lane(P, `M${CX[3] + 70} ${CY + CH} V354`, 'cust', true)}
${lt(CX[3] + 78, 330, '멈춘 상태 저장', 'cust')}
${lane(P, `M${CX[3] + 128} ${CY + CH} V318 H${CX[5] + 30} V354`, 'sys')}
${lt(CX[4] + 20, 314, '승인 후 실행', 'sys')}
${baseTile(20, 266, 'model', '로컬 모델 (Ollama)', ['qwen2.5:14b · tool calling · num_ctx 8,192', 'bge-m3 임베딩 · 외부 호출 없음'], 'llm')}
${baseTile(300, 276, 'db', 'PostgreSQL · pgvector', ['상품 · 주문 · 장바구니 · 문의 (기존 테이블)', '규정 청크 벡터 (관리자 업로드 때 색인)'])}
${baseTile(590, 250, 'ckpt', '체크포인터', ['thread_id별 대화 상태 · 확인 대기', '승인하면 멈춘 곳부터 재개'])}
${baseTile(854, 192, 'api', '기존 서비스 API', ['장바구니 · 주문 취소 · 1:1 문의', '재고 · 본인 주문 규칙 그대로'])}
</svg>`;
}

// =====================================================================
// 2. 기술 구조 — 화면 · 서버 · 모델 · 저장 층 + 보안 통제 + 품질 관문
// =====================================================================
const TW = 1160, TH = 486;
const pills = (list) => list.map((p) => `<span class="pill">${p}</span>`).join('');
const tBox = (x, y, w, h, role, iconName, head, techs, body, cls = '') =>
  `<g class="r-${role}"><rect class="tb ${cls}" x="${x}" y="${y}" width="${w}" height="${h}"/>` +
  `<rect class="tb-h" x="${x}" y="${y}" width="${w}" height="3.5"/>` +
  `<g style="color:var(--role)">${ic(iconName, x + 9, y + 11, 0.9)}</g></g>` +
  fo(x + 36, y + 8, w - 42, h - 10, `<div class="th"><b>${head}</b>${pills(techs)}</div>${body}`, `tf r-${role}`);
const tTier = (y, h, name, sub, cls = '') =>
  `<rect class="tier ${cls}" x="8" y="${y}" width="84" height="${h}"/>` + fo(8, y, 84, h, `<b>${name}</b><span>${sub}</span>`, `tl ${cls}`);
const minis = (list, n = list.length) =>
  `<div class="minis" style="--n:${n}">${list.map(([i, h, s]) => `<div>${icon(i)}<p style="margin:0"><b>${h}</b><span>${s}</span></p></div>`).join('')}</div>`;

export function techSvg({ tests = 47, actN = '14 × 3', agentN = 12 } = {}) {
  const P = 'te';
  const SEC = [
    ['key', '고객 = 토큰으로만', '요청 본문의 user_id 무시'],
    ['users', '대화 주인 검사', '남의 thread 재개는 403'],
    ['eyeNo', '권한별 도구 노출', '비로그인엔 실행 도구 숨김'],
    ['filter', '의도 게이트', '이번 질문에서 요청한 작업만'],
    ['lock', '사전 검사 · 확인 문구', '확인 문구는 서버가 DB 값으로'],
    ['shield', '지시 출처 분리', '문서 속 지시문 청크 제외'],
    ['cloudNo', '외부 전송 0', 'LLM · 임베딩 모두 로컬'],
  ];
  const GATES = [`pytest ${tests} (가짜 LLM · 0.2초)`, `에이전트 평가 ${agentN} 시나리오`, `실행 평가 ${actN} (DB 상태 채점)`, '장애 주입 10', '반복 측정 10 × 3', '규정 RAG 24문항', '컨텍스트 예산 (토크나이저)'];
  return `<svg class="d" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}" xmlns="http://www.w3.org/2000/svg">
<defs>${markers(P)}</defs>
<g class="act">${ic('users', 104, 6, 1)}</g>
${fo(134, 0, 300, 38, '<b>고객 · 관리자 브라우저</b><p>AI 챗 위젯 · CRM 규정 문서 관리</p>', 'edge')}
<g class="act no">${ic('cloudNo', 664, 6, 1)}</g>
${fo(694, 0, 246, 38, '<b>외부 LLM API</b><p>쓰지 않음 · 모델은 모두 로컬</p>', 'edge')}
${lane(P, 'M116 34 V48', 'sys')}

<rect class="frame" x="98" y="44" width="842" height="388" rx="3"/>
<rect class="frame-bg" x="110" y="37" width="196" height="14"/>
<text class="frame-t" x="116" y="48.5" style="font-size:11.5px">로컬 GPU PC (RTX 5070)</text>

${tTier(54, 70, '화면', 'Next.js')}
${tBox(108, 54, 822, 70, 'sys', 'monitor', '웹 프론트엔드', ['Next.js 15', 'React 18', 'TypeScript', 'Tailwind 4', 'TanStack Query'], minis([
    ['chat', 'AI 챗 위젯', '도구 진행 표시 · 실행 전 확인 카드 · 출처 · 상품 카드'],
    ['docs', 'CRM 문서 관리', '규정 PDF 업로드 · 색인'],
    ['link', 'API 호출', 'fetch SSE 스트림 · JWT 헤더'],
  ]))}
${lane(P, 'M300 124 V140', 'sys')}
${lt(308, 136, 'REST · SSE · JWT (Bearer)', 'sys')}

${tTier(140, 142, '서버', 'FastAPI')}
${tBox(108, 140, 300, 142, 'sys', 'server', 'API 서버', ['FastAPI 0.115', 'Pydantic 2'], `
  <p class="ln"><b style="color:var(--ink)">/agent/chat · /agent/resume</b></p>
  <p class="ln">토큰으로 고객 확인 · 대화 주인 검사 · SSE 이벤트 스트림</p>
  <p class="ln" style="margin-top:6px"><b style="color:var(--ink)">기존 라우터 21개</b></p>
  <p class="ln">cart · orders · inquiry · documents · auth …</p>`)}
${lane(P, 'M408 200 H424', 'sys')}
${tBox(426, 140, 504, 142, 'sys', 'route', '에이전트', ['LangGraph 1.0', 'StateGraph', 'interrupt'], `
  <div class="steps">
    <div class="llm"><b>agent</b><small>도구 선택 · 답변</small></div><i>›</i>
    <div><b>tools</b><small>조회 · 사전 검사</small></div><i>›</i>
    <div class="cust"><b>confirm</b><small>고객 승인 대기</small></div><i>›</i>
    <div><b>verify</b><small>검사 12가지</small></div><i>›</i>
    <div><b>finalize</b><small>P# → DB</small></div>
  </div>
  <div class="mods"><span>graph.py</span><span>tools.py</span><span>actions.py</span><span>verify.py</span><span>memory.py</span><span>llm.py</span></div>`)}

${tTier(298, 64, 'LLM · 임베딩', 'Inference', 'llm')}
${tBox(108, 298, 380, 64, 'llm', 'chip', 'LLM 서버', ['Ollama', 'qwen2.5:14b'], '<p class="ln">tool calling · 구조화 출력 (JSON 스키마) · num_ctx 8,192</p><p class="ln">5xx 재시도 1회 · 텍스트로 쓴 도구 호출 복구</p>')}
${tBox(500, 298, 210, 64, 'llm', 'vec', '임베딩', ['bge-m3', 'CPU'], '<p class="ln">1024차원 · 질문 77ms</p><p class="ln">규정 색인 · 검색 같은 모델</p>')}
${tBox(722, 298, 208, 64, 'llm', 'search', '이미지 검색', ['CLIP ViT-B/32'], '<p class="ln">512차원 · API 86ms</p><p class="ln">사진으로 비슷한 상품</p>')}
${lane(P, 'M520 282 V296', 'llm')}
${lt(528, 293, '생성 · 인자', 'llm')}

${tTier(378, 46, '저장', 'Data')}
${tBox(108, 378, 470, 46, 'store', 'db', 'PostgreSQL', ['Supabase', 'pgvector'], '<p class="ln">상품 · 주문 · 장바구니 · 문의 · 규정 청크 벡터</p>')}
${tBox(590, 378, 340, 46, 'store', 'save', '체크포인터', ['PostgresSaver'], '<p class="ln">thread_id 상태 · 확인 대기 · 대화 주인</p>')}

${lane(P, 'M930 200 H950', 'cust')}
<rect class="sec" x="952" y="44" width="200" height="388"/>
<g style="color:var(--cust)">${ic('shield', 962, 54, 1)}</g>
${fo(990, 52, 158, 30, '<b>보안 통제</b>', 'sec-h')}
${SEC.map(([i, h, s], k) => `<g style="color:var(--cust)">${ic(i, 964, 98 + k * 47, 0.85)}</g>` + fo(990, 92 + k * 47, 158, 46, `<b>${h}</b><span>${s}</span>`, 'sec-row')).join('\n')}

${fo(8, 444, 1144, 40, `<b>품질 관문 · 고칠 때마다</b>${GATES.map((g) => `<span>${g}</span>`).join('')}`, 'gates')}
</svg>`;
}

// =====================================================================
// 3. 에이전트 그래프 — LangGraph 노드 · 조건 분기
// =====================================================================
export function graphSvg() {
  const P = 'gr';
  const W = 724, H = 472;
  const node = (x, y, w, h, role, name, tag, lines, key = false) =>
    `<g class="r-${role}"><rect class="gn${key ? ' key' : ''}" x="${x}" y="${y}" width="${w}" height="${h}"/><rect class="gn-h" x="${x}" y="${y}" width="${w}" height="3.5"/></g>` +
    fo(x, y + 2, w, h - 2, `<b>${name}<small>${tag}</small></b><p>${lines}</p>`, `gnt r-${role}`);
  const term = (x, y, w, h, name, sub) =>
    `<rect class="gn term" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/>` +
    fo(x, y, w, h, `<div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center"><b style="font-family:var(--mono);font-size:13px">${name}</b><span style="font-size:10.8px;color:var(--g500)">${sub}</span></div>`);
  return `<svg class="d" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>${markers(P)}</defs>
${term(0, 200, 96, 62, 'START', '질문 · 로그인<br/>이월된 대화')}
${node(132, 178, 172, 106, 'llm', 'agent', 'LLM', 'qwen2.5:14b tool calling<br/>도구 호출 또는 최종 답변', true)}
${node(132, 10, 172, 100, 'sys', 'tools', '코드', '조회 도구 병렬 실행<br/>실행 도구는 의도 게이트<br/>+ 사전 검사만')}
${node(350, 10, 172, 100, 'cust', 'confirm', '고객', 'interrupt 로 멈춤<br/>승인 → 기존 API 실행<br/>거절 → 실행 안 함', true)}
${node(350, 178, 172, 106, 'sys', 'verify', '코드', '번호 · 수치 · 언어 · 누락<br/>거짓 실행 · 형식 노출')}
${node(568, 178, 156, 106, 'sys', 'finalize', '코드', '[P#] → DB 상품명<br/>조사 보정 · 카드 · 출처')}
<rect class="gn term" x="350" y="366" width="172" height="80" style="stroke-dasharray:4 3"/>
${fo(350, 366, 172, 80, '<b style="font-size:13.5px;font-family:var(--font)">다시 작성 (1회)</b><p>문제를 피드백으로 붙이고<br/>빠진 도구는 확정 호출</p>', 'gnt')}
${term(568, 372, 156, 62, 'END', 'answer 이벤트')}

${lane(P, 'M96 231 H130', 'out')}
${lane(P, 'M176 178 V112', 'llm')}${lt(150, 150, '도구 호출', 'llm')}
${lane(P, 'M262 110 V176', 'sys', true)}${lt(268, 150, '결과', 'sys')}
${lane(P, 'M304 60 H348', 'sys')}${lt(306, 52, '실행 도구', 'sys')}
${lane(P, 'M436 110 V140 H290 V176', 'cust', true)}${lt(332, 136, '실행 결과', 'cust')}
${lane(P, 'M304 231 H348', 'llm')}${lt(306, 222, '최종 답변', 'llm')}
${lane(P, 'M522 231 H566', 'sys')}${lt(530, 222, '통과', 'sys')}
${lane(P, 'M436 284 V364', 'sys')}${lt(444, 330, '실패', 'sys')}
${lane(P, 'M350 406 H218 V286', 'llm', true)}
${lane(P, 'M646 284 V370', 'out')}
</svg>`;
}

// =====================================================================
// 4. 보안 — 요청 경로(누가 시켰나) · 문서 경로(무엇이 시켰나)
// =====================================================================
export function secSvg() {
  const P = 'sc';
  const W = 1160, H = 214;
  const chk = (x, y, w, n, iconName, head, sub, role = 'sys') =>
    `<g class="r-${role}"><rect class="tile" x="${x}" y="${y}" width="${w}" height="66"/><rect class="tile-bar" x="${x}" y="${y}" width="${w}" height="3"/>` +
    `<circle class="num" cx="${x + 14}" cy="${y + 17}" r="8"/><text class="num-t" x="${x + 14}" y="${y + 21}" style="font-size:10px">${n}</text>` +
    `<g style="color:var(--role)">${ic(iconName, x + w - 30, y + 9, 0.85)}</g></g>` +
    fo(x + 8, y + 28, w - 12, 38, `<b style="font-size:12.5px;display:block;color:var(--ink)">${head}</b><span style="font-size:10.8px;color:var(--g500);line-height:1.3;display:block">${sub}</span>`);
  const end = (x, y, w, head, sub, cls = '') =>
    `<rect class="base ${cls}" x="${x}" y="${y}" width="${w}" height="66"/>` +
    fo(x + 10, y + 10, w - 16, 52, `<b style="font-size:13px;display:block;color:var(--ink)">${head}</b><span style="font-size:11px;color:var(--g700);line-height:1.35;display:block">${sub}</span>`);
  const xs = [96, 254, 412, 570, 728, 886];
  return `<svg class="d" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>${markers(P)}</defs>
<text class="zone" x="0" y="13">요청 경로 · 누가 시켰나</text>
<g class="act">${ic('user', 22, 38, 1.2)}</g>
${fo(0, 70, 92, 30, '<p style="margin:0;font-size:11px;color:var(--g500);text-align:center">고객 요청</p>')}
${chk(xs[0], 24, 142, 1, 'key', '토큰으로 고객 확인', '본문 user_id 무시')}
${chk(xs[1], 24, 142, 2, 'users', '대화 주인 검사', '남의 thread → 새 대화 · 403')}
${chk(xs[2], 24, 142, 3, 'eyeNo', '권한별 도구', '비로그인엔 실행 도구 없음')}
${chk(xs[3], 24, 142, 4, 'filter', '의도 게이트', '이번 질문에서 요청한 작업만')}
${chk(xs[4], 24, 142, 5, 'lock', '사전 검사', '본인 주문 · 상태 · 대상 일치')}
${chk(xs[5], 24, 142, 6, 'pause', '고객 승인', '서버가 만든 확인 문구', 'cust')}
${end(1044, 24, 116, '기존 API 실행', '재고 · 취소 규칙 그대로')}
${[0, 1, 2, 3, 4, 5].map((i) => lane(P, `M${xs[i] + 142} 57 H${(xs[i + 1] || 1044) - 2}`, i === 5 ? 'cust' : 'sys')).join('')}
${lane(P, 'M50 57 H94', 'out')}

<text class="zone" x="0" y="125">문서 경로 · 무엇이 시켰나</text>
<g class="act">${ic('doc', 22, 150, 1.2)}</g>
${fo(0, 182, 92, 30, '<p style="margin:0;font-size:11px;color:var(--g500);text-align:center">검색된 규정 청크</p>')}
${chk(xs[0], 136, 142, 1, 'filter', '지시문 청크 제외', '"지시 무시 · 담아라" 패턴')}
${chk(xs[1], 136, 142, 2, 'memo', '정보로만 전달', '프롬프트: 문서는 지시가 아님')}
<g class="r-llm"><rect class="tile" x="${xs[2]}" y="136" width="142" height="66"/><rect class="tile-bar" x="${xs[2]}" y="136" width="142" height="3"/></g>
${fo(xs[2] + 10, 146, 126, 54, '<b style="font-size:12.5px;display:block;color:var(--llm)">LLM 답변 초안</b><span style="font-size:10.8px;color:var(--g500);line-height:1.3;display:block">모델이 지시를 따르더라도</span>')}
${chk(xs[3], 136, 142, 3, 'alert', '거짓 실행 차단', '실행 결과 없이 "담았습니다"')}
${chk(xs[4], 136, 142, 4, 'ccheck', '실행은 승인 경로만', '실행 도구 → 위 ④ ⑤ ⑥')}
${end(xs[5], 136, 274, '실제 변경 0건', '문서 인젝션 평가: 지시문이 검색 상위여도 6,000원으로 답하고 담지 않음', '')}
${[0, 1, 2, 3, 4].map((i) => lane(P, `M${xs[i] + 142} 169 H${xs[i + 1] - 2}`, i === 1 ? 'llm' : 'sys')).join('')}
${lane(P, 'M50 169 H94', 'out')}
</svg>`;
}

// =====================================================================
// 5. 한 장 요약 그림 — 기존(한 경로에 다 넣음) / 에이전트(골라 쓰고 검사)
// =====================================================================
export const sumOld = () => {
  // 프롬프트 한 장: 위에서부터 지시문 · 규정 3건 · 상품 50개 · 리뷰 (토큰 비례), 아래쪽 4,096만 창에 들어감
  const top = 8, h = 118, tot = 8879, px = (v) => (v / tot) * h;
  const parts = [['지시문', 259, 'var(--navy)'], ['규정', 674, 'var(--g400)'], ['상품 정보 50개', 4974, 'var(--g500)'], ['리뷰 전부', 2972, 'var(--g700)']];
  const win = top + h - px(4096);
  let y = top;
  const blocks = parts.map(([n, v, c]) => {
    const y0 = y, y1 = y + Math.max(5, px(v)); y = y1;
    const cut = Math.min(y1, win);                       // 창 위 = 잘리는 부분 (옅게)
    let r = '';
    if (cut > y0) r += `<rect x="22" y="${y0}" width="80" height="${cut - y0 - 1.5}" style="fill:var(--g200)"/>`;
    if (y1 > win) r += `<rect x="22" y="${Math.max(y0, win)}" width="80" height="${y1 - Math.max(y0, win) - 1.5}" style="fill:${c}"/>`;
    const above = cut - y0, inside = y1 - Math.max(y0, win);
    if (Math.max(above, inside) > 18) {
      const inUp = above >= inside, cy = inUp ? (y0 + cut) / 2 : (Math.max(y0, win) + y1) / 2;
      r += `<text x="62" y="${cy + 4}" style="font-size:10.5px;font-weight:800;fill:${inUp ? 'var(--g500)' : '#fff'};text-anchor:middle">${n}</text>`;
    }
    return r;
  }).join('');
  return `<svg class="d" width="176" height="136" viewBox="0 0 176 136">
  <rect class="il-w" x="14" y="2" width="96" height="130"/>
  ${blocks}
  <path d="M9 ${win} H115" style="stroke:var(--ink);stroke-width:1.6;stroke-dasharray:4 3;fill:none"/>
  <rect x="9" y="${win}" width="106" height="${top + h - win + 2}" style="fill:none;stroke:var(--ink);stroke-width:2"/>
  <text x="120" y="${win + 14}" style="font-size:11px;font-weight:800;fill:var(--ink)">창 4,096</text>
  <text x="120" y="${top + 16}" style="font-size:11px;font-weight:800;fill:var(--ink)">앞부분</text>
  <text x="120" y="${top + 30}" style="font-size:11px;font-weight:800;fill:var(--ink)">잘림</text>
  <text x="120" y="${top + h - 2}" style="font-size:11px;font-weight:700;fill:var(--g500)">8,879</text>
</svg>`;
};
export const sumNew = () => {
  const tool = (y, label, on) => `<rect x="2" y="${y}" width="58" height="24" style="fill:#fff;stroke:${on ? 'var(--sys)' : 'var(--g300)'};stroke-width:${on ? 1.6 : 1.1};${on ? '' : 'stroke-dasharray:3 2'}"/>` +
    `<text x="31" y="${y + 16}" style="font-size:10.5px;font-weight:800;fill:${on ? 'var(--ink)' : 'var(--g400)'};text-anchor:middle">${label}</text>`;
  return `<svg class="d" width="176" height="136" viewBox="0 0 176 136">
  ${tool(8, '상품 검색', true)}${tool(56, '규정 검색', true)}${tool(104, '주문 조회', false)}
  <path d="M60 20 L76 54 M60 68 H76 M60 116 L76 82" style="fill:none;stroke:var(--sys);stroke-width:1.4"/>
  <g class="r-llm"><rect class="il-tint" x="76" y="46" width="44" height="44" rx="5"/>
  <path class="il-role thin" d="M85 46 v-6 M98 46 v-6 M111 46 v-6 M85 90 v6 M98 90 v6 M111 90 v6"/>
  <text class="il-tr" x="98" y="72.5" style="font-size:12px">LLM</text></g>
  <path d="M120 60 H134" style="stroke:var(--g500);stroke-width:1.4;fill:none"/>
  <circle cx="152" cy="44" r="16" style="fill:#fff;stroke:var(--sys);stroke-width:1.8"/><path d="M144.5 44.5 l5 5 l10 -11" style="fill:none;stroke:var(--sys);stroke-width:2.2"/>
  <text x="152" y="74" style="font-size:10px;font-weight:800;fill:var(--sys);text-anchor:middle">검증</text>
  <rect x="128" y="96" width="48" height="24" style="fill:var(--cust)"/><text x="152" y="112.5" style="font-size:11px;font-weight:800;fill:#fff;text-anchor:middle">승인</text>
  <path d="M120 80 L128 100" style="stroke:var(--g500);stroke-width:1.4;fill:none"/>
</svg>`;
};
export const bigArrow = () => `<svg width="44" height="24" viewBox="0 0 44 24"><path d="M2 12 H34" style="stroke:var(--navy);stroke-width:3.2;fill:none"/><path d="M30 4 L42 12 L30 20 z" style="fill:var(--navy)"/></svg>`;
