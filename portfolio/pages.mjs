// =====================================================================
// 쪽별 문구 — 문구는 여기서만 고칩니다.  (v2: 13쪽 · 도식과 실제 화면 중심)
//   shot(이름, { crop:[x,y,w,h], bar, url, markers, boxes })   shots/<이름>.png
//   dg({ w, h, nodes, edges })                                    흐름도
//   M('키')  data/metrics.json 값 (문자열)   ·   MX 원본 객체   ·   V  data/visual.json
// =====================================================================

export const META = {
  name: '최원준',
  career: '개발 경력 3년차',
  project: '재직 중 1인 개인 프로젝트',
  repo: 'github.com/JongBeams/ShoppingMall',
  role: 'RAG · LLM 서비스 개발',
};

export function pages({ shot, py, M, dg, asset, V, MX }) {
  const P = [];
  const won = (n) => `${Number(n).toLocaleString('ko-KR')}원`;
  const tile = (no, title, sub, name, crop) =>
    `<div class="tile">${shot(name, { crop, bar: false })}<div class="tl"><em>${no}</em><b>${title}</b><span>${sub}</span></div></div>`;

  // ------------------------------------------------------------------ 표지
  P.push({
    id: 'cover', cover: true,
    html: `
    <div class="inner" style="max-width:640px">
      <div class="eyebrow">PORTFOLIO · ${META.role}</div>
      <h1 style="font-size:42px">쇼핑몰에 붙인<br/>RAG · 비전 검색 · LLM 추천</h1>
      <div class="sub" style="max-width:560px;font-size:16.5px">PDF 규정을 근거로 답하는 RAG 챗봇부터 사진 검색, 구매 이력 기반 추천까지 —
        로컬 LLM으로 직접 만들고, <b style="color:#fff">평가셋으로 환각과 프롬프트 잘림을 찾아낸</b> 기록입니다.</div>
      <div class="chips">
        <span>RAG</span><span>bge-m3</span><span>CLIP</span><span>qwen2.5:14b · Ollama</span><span>pgvector</span><span>FastAPI · SSE</span>
      </div>
      <div class="meta">
        <div>지원자<b>${META.name}</b></div>
        <div>경력<b>${META.career}</b></div>
        <div>프로젝트<b>AI 쇼핑몰 · ${META.project}</b></div>
      </div>
    </div>
    <div class="hero-shot"><img src="${asset('hero.png')}"/></div>`,
    notes: '표지. 오른쪽은 실제 화면: 쇼핑몰 홈에서 AI 챗이 규정 PDF를 근거로 답하고 출처를 붙인 장면.',
  });

  // ------------------------------------------------------------------ 1. 서비스 한눈에
  P.push({
    id: 'gallery', no: '01', kicker: 'Service',
    title: '실제로 동작하는 AI 쇼핑몰 — 화면으로 먼저 보기',
    lead: '아래 화면은 모두 실제 앱을 돌려 캡처했습니다. 답변·추천·요약은 로컬 LLM(qwen2.5:14b)이 실시간으로 생성한 결과입니다.',
    body: `
    <div class="tiles">
      ${tile('01', '규정 상담 RAG', '규정 PDF를 근거로 답하고 출처 표시', 'hero', [937, 105, 476, 248])}
      ${tile('02', '사진으로 상품 찾기', 'CLIP 유사도 순 Top-5', 'image-search-full', [120, 280, 1200, 631])}
      ${tile('03', 'AI 선물 마법사', '7개 질문 → 추천 3개 + 메시지', 'gift-result-full', [176, 140, 1088, 572])}
      ${tile('04', '쇼핑 추천 챗', '답변에 언급된 상품만 카드로', 'chat-shop', [0, 652, 480, 252])}
      ${tile('05', '개인화 추천', '구매 이력을 근거로 한 첫마디', 'chat-personal', [0, 60, 480, 252])}
      ${tile('06', 'AI 리뷰 요약', '장점 · 단점 · 구매 팁 4섹션', 'review-summary-box', [0, 0, 954, 502])}
    </div>`,
    notes: '서비스 화면 6장. 이후 쪽에서 각 기능이 어떻게 동작하는지 흐름도로 설명합니다.',
  });

  // ------------------------------------------------------------------ 2. 역할 · 구조
  const svc = (y, t, s) => ({ x: 532, y, w: 276, h: 52, t, s, k: 'a' });
  P.push({
    id: 'arch', no: '02', kicker: 'Role · Architecture',
    title: '기획부터 AI · 백엔드 · 화면까지, 혼자 만들었습니다',
    lead: '회사에 다니며 개인적으로 만든 1인 프로젝트입니다. 문서 색인부터 벡터 검색 · 프롬프트 · 스트리밍 · 화면까지 — <b>파란 테두리가 AI 모듈</b>입니다.',
    body: `
    <div class="strip" style="margin-bottom:16px">
      <div><b>1인 개발</b><span>재직 중 개인 프로젝트 · 기획부터 배포 설정까지</span></div>
      <div><b>6개</b><span>AI 기능 (RAG · 추천 · 개인화 · 비전 · 선물 · 요약)</span></div>
      <div><b>3,300줄</b><span>AI 모듈 Python 코드</span></div>
      <div><b>0원</b><span>외부 LLM API 비용 (로컬 추론)</span></div>
    </div>
    ${dg({
      w: 1160, h: 352,
      nodes: {
        g1: { x: 0, y: 0, w: 210, h: 352, t: '화면 · Next.js', k: 'g' },
        c1: { x: 12, y: 34, w: 186, h: 66, t: 'AI 챗 위젯', s: '규정 · 일반 · 쇼핑추천 · 상담사' },
        c2: { x: 12, y: 112, w: 186, h: 66, t: '이미지 검색', s: '사진 업로드 → 유사 상품' },
        c3: { x: 12, y: 190, w: 186, h: 66, t: '선물 마법사 · 리뷰 요약', s: '7단계 질문 / 상품 상세' },
        c4: { x: 12, y: 268, w: 186, h: 66, t: 'CRM 문서관리', s: '관리자 PDF 업로드' },
        api: { x: 270, y: 0, w: 190, h: 352, t: 'FastAPI', html: `<i style="margin-top:8px;line-height:1.9;font-family:var(--mono);font-size:10.8px">/documents/upload<br/>/documents/search<br/>/chat/smart<br/>/products/search-by-image<br/>/gift-wizard<br/>/reviews/summary</i><i style="margin-top:8px">모든 LLM 응답은 SSE 스트리밍</i>` },
        g3: { x: 520, y: 0, w: 300, h: 352, t: 'AI 서비스 — 직접 구현', k: 'g' },
        s1: svc(34, 'RAG 검색', '임베딩 · 벡터 검색 · 근거 프롬프트'),
        s2: svc(96, '추천 라우터', '질문 유형별로 컨텍스트 조립'),
        s3: svc(158, '개인화 분석', '구매 패턴 → 매칭 점수'),
        s4: svc(220, 'CLIP 이미지 검색', '512차원 · 코사인 유사도'),
        s5: svc(282, '선물 추천 · 리뷰 요약', 'JSON 구조화 출력 · 고정 형식'),
        g4: { x: 880, y: 0, w: 280, h: 352, t: '모델 · 데이터', k: 'g' },
        m1: { x: 892, y: 34, w: 256, h: 56, t: 'BAAI/bge-m3', s: '문서 · 질문 · 조건 임베딩 1024d' },
        m2: { x: 892, y: 100, w: 256, h: 56, t: 'CLIP ViT-B/32', s: '이미지 임베딩 512d' },
        m3: { x: 892, y: 166, w: 256, h: 56, t: 'qwen2.5:14b · Ollama', s: '답변 · 추천 · 요약 생성', k: 'f' },
        m4: { x: 892, y: 232, w: 256, h: 102, t: 'PostgreSQL + pgvector', s: '청크 · 상품 이미지 벡터<br/>주문 · 리뷰 · 상품', k: 'd' },
      },
      edges: [['g1', 'api', 'HTTP · SSE'], ['api', 'g3'], ['g3', 'g4', '임베딩 · 생성 · 검색', { hot: true }]],
    })}`,
    notes: '회사에 다니며 혼자 만든 개인 프로젝트. 화면·API·AI 모듈·데이터까지 전부 직접 구현. 벡터는 별도 벡터 DB 없이 PostgreSQL(pgvector)에 상품·주문과 함께 둠.',
  });

  // ------------------------------------------------------------------ 3. RAG 파이프라인
  const nd = (x, y, t, s, k = '', w = 160, h = 76) => ({ x, y, w, h, t, s, k });
  P.push({
    id: 'rag-pipeline', no: '03', kicker: 'RAG Pipeline',
    title: '업로드한 PDF가 출처 달린 답변이 되기까지',
    lead: '색인과 질문, 두 갈래가 <b>같은 임베딩 모델(bge-m3)</b>로 같은 벡터 공간에서 만납니다. 선 위 숫자는 실측값입니다.',
    body: dg({
      w: 1160, h: 420,
      nodes: {
        lab1: { x: 0, y: 4, w: 400, h: 22, t: '① 색인 — 관리자가 규정 PDF 업로드', k: 'lbl' },
        i1: nd(0, 34, 'PDF 업로드', 'CRM · 50MB · .pdf 검증'),
        i2: nd(200, 34, '텍스트 추출', 'PyPDF2 · 페이지별'),
        i3: nd(400, 34, '청킹', 'LangChain 재귀 분할<br/>500자 · 50자 겹침'),
        i4: nd(600, 34, '임베딩', 'bge-m3 · 1024차원 · 정규화', 'a'),
        db: { x: 800, y: 34, w: 150, h: 290, t: '벡터 DB', s: 'PostgreSQL<br/>+ pgvector<br/><br/>규정 PDF 4건<br/>→ 청크 8개', k: 'd c' },
        lab2: { x: 0, y: 200, w: 400, h: 22, t: '② 질문 — 고객이 챗에서 질문', k: 'lbl' },
        q1: nd(0, 230, '고객 질문', '"단순 변심 반품하면<br/>배송비 얼마야?"'),
        q2: nd(200, 230, '질문 임베딩', '색인과 같은 bge-m3', 'a'),
        note: { x: 400, y: 230, w: 360, h: 76, t: '같은 모델 → 같은 벡터 공간', s: 'L2 정규화로 코사인 유사도 = 내적. DB 검색이 실패하면 Python 코사인 계산으로 자동 대체(fallback).', k: 'g' },
        o1: nd(1000, 34, '근거 청크 3개', '+ 출처 파일명 먼저 전송', '', 160, 70),
        o2: nd(1000, 128, '근거 프롬프트', '문서 안에서만 답하고<br/>없으면 "찾을 수 없습니다"', '', 160, 76),
        o3: nd(1000, 228, 'qwen2.5:14b', '로컬 · 토큰 스트리밍', 'f', 160, 64),
        o4: nd(1000, 330, '답변 + 참고 문서', '"왕복 배송비 6,000원…"', 'a', 160, 76),
      },
      edges: [
        ['i1', 'i2'], ['i2', 'i3'], ['i3', 'i4'], ['i4', 'db', '청크 8 · 1024d'],
        ['q1', 'q2'], ['q2', 'db', `질문 벡터 · ${M('latency.embed_ms')}`, { a: 'b', b: 'b', ym: 360 }],
        ['db', 'o1', `top-3 · ≥0.5 · ${M('latency.rpc_ms')}`, { hot: true, a: 'r', b: 'l' }],
        ['o1', 'o2'], ['o2', 'o3'], ['o3', 'o4', `첫 토큰 ${M('latency.ttft_s')}`, { hot: true }],
      ],
    }) + `<div class="strip" style="margin-top:6px">
      <div><b style="font-size:14px">왜 bge-m3?</b><span>규정·질문이 모두 한국어 — 다국어 모델 하나로 문서·질문·선물 조건까지 같은 벡터 공간</span></div>
      <div><b style="font-size:14px">왜 500자 · 50자 겹침?</b><span>규정 한 조항이 한 청크에 — 경계에서 잘린 문장은 다음 청크에도 남게</span></div>
      <div><b style="font-size:14px">왜 별도 벡터 DB 없이?</b><span>상품·주문과 같은 PostgreSQL(pgvector) — 조인이 쉽고 운영이 단순</span></div>
    </div>`,
    notes: '색인: PDF→추출→청킹(LangChain RecursiveCharacterTextSplitter, 직접 만든 분할기에서 교체)→bge-m3→저장. 질문: 같은 모델로 임베딩→코사인 top-3(임계값 0.5)→근거 프롬프트→스트리밍.',
  });

  // ------------------------------------------------------------------ 4. RAG 실제 화면 + 타임라인
  const T = 8.0, X = (s) => (s / T) * 100;
  const e = parseFloat(MX?.latency?.embed_ms) / 1000 || 0.106, r = parseFloat(MX?.latency?.rpc_ms) / 1000 || 0.011;
  const ft = parseFloat(MX?.latency?.ttft_s) || 4.6, tt = parseFloat(MX?.latency?.total_s) || 7.5;
  P.push({
    id: 'rag-demo', no: '04', kicker: 'RAG in Action',
    title: '관리자는 PDF만 올리고, 고객은 출처와 함께 답을 받습니다',
    lead: '같은 데이터가 두 화면을 잇습니다. 아래 막대는 이 질문 하나가 처리되는 시간(중앙값)입니다.',
    body: `
    <div class="row" style="gap:20px">
      <div class="col" style="width:600px">
        ${shot('crm-documents', { url: 'CRM › AI 문서관리', crop: [372, 120, 960, 520] })}
      </div>
      <div class="col grow">
        ${shot('hero', { url: '고객 화면 › AI 챗 · 규정문서', crop: [937, 105, 476, 258] })}
      </div>
    </div>
    <div class="card" style="margin-top:16px;padding:14px 18px 6px">
      <div class="tline">
        <div class="lb" style="left:0">검색 ${Math.round((e + r) * 1000)}ms</div>
        <div class="seg" style="left:0;width:max(6px,${X(e + r)}%);background:var(--rag)"></div>
        <div class="seg" style="left:${X(e + r)}%;width:${X(ft - e - r)}%;background:#d9dde5"></div>
        <div class="lb" style="left:${X(1.6)}%;color:var(--muted);font-weight:600">프롬프트 처리 (로컬 14B)</div>
        <div class="seg" style="left:${X(ft)}%;width:${X(tt - ft)}%;background:var(--rag);opacity:.55"></div>
        <div class="lb" style="left:${X(ft) + 1}%">토큰 스트리밍 → 화면에 바로 표시</div>
        <div class="tk" style="left:0%">0s</div>
        <div class="tk" style="left:${X(ft)}%">첫 토큰 ${ft}s</div>
        <div class="tk" style="left:${X(tt)}%">완료 ${tt}s</div>
      </div>
    </div>`,
    notes: '검색은 0.1초대, 대부분의 시간은 생성. 그래서 출처를 먼저 보내고 토큰을 스트리밍해 기다림을 줄였다.',
  });

  // ------------------------------------------------------------------ 5. 추천 챗 라우터
  P.push({
    id: 'router', no: '05', kicker: 'LLM Router',
    title: '질문을 읽고 길을 고르는 추천 챗',
    lead: '질문 유형에 따라 <b>LLM에 넣을 후보를 다르게 조립</b>하고, 답변이 끝나면 <b>LLM이 실제로 언급한 상품만</b> 카드로 돌려줍니다.',
    body: `
    <div class="row" style="gap:24px;align-items:flex-start">
      ${dg({
        w: 730, h: 440,
        nodes: {
          q: { x: 0, y: 182, w: 104, h: 76, t: '질문', s: '입력 검증<br/>500자 · XSS', k: 'c' },
          rt: { x: 130, y: 160, w: 130, h: 120, t: '라우터', s: '키워드 추출<br/>추천 의도 단어<br/>로그인 여부', k: 'f c' },
          a: { x: 300, y: 30, w: 180, h: 84, t: 'A · 키워드', s: '"러닝화 추천해줘"<br/>→ 태그 일치 상품 + 리뷰 3' },
          b: { x: 300, y: 178, w: 180, h: 84, t: 'B · 개인화', s: '로그인 + "어울리는…"<br/>→ 구매 패턴 매칭 상품' },
          c: { x: 300, y: 326, w: 180, h: 84, t: 'C · 기본', s: '그 외<br/>→ 신상품 50' },
          ctx: { x: 530, y: 30, w: 200, h: 84, t: '컨텍스트 조립', s: '규정 청크 3 + 상품 후보<br/>+ 상품별 최근 리뷰' },
          llm: { x: 530, y: 178, w: 200, h: 84, t: 'qwen2.5:14b', s: '조건(개수·기준)을 지켜<br/>고르고 근거 설명', k: 'f' },
          flt: { x: 530, y: 326, w: 200, h: 84, t: '사후 필터', s: '답변 문자열에 실제<br/>카탈로그 상품명이 있는 것만', k: 'a' },
        },
        edges: [
          ['q', 'rt'], ['rt', 'a', '', { a: 'r', b: 'l' }], ['rt', 'b'], ['rt', 'c', '', { a: 'r', b: 'l' }],
          ['a', 'ctx'], ['b', 'ctx', '', { a: 'r', b: 'l', xm: 505 }], ['c', 'ctx', '', { a: 'r', b: 'l', xm: 505 }],
          ['ctx', 'llm', 'SSE 토큰'], ['llm', 'flt', 'products_final', { hot: true }],
        ],
      })}
      <div class="col grow">
        ${shot('chat-shop', { url: '"러닝화 추천해줘" → 카드 2개', crop: [0, 470, 480, 412] })}
        <div class="cap2">후보 3개 중 LLM이 답변에서 고른 <b>2개만</b> 실제 상품 카드로 — 존재하지 않는 상품 링크가 나가지 않습니다.</div>
      </div>
    </div>`,
    notes: '규칙 기반 라우터 + 컨텍스트 조립 + 생성 후 검증. 다음 단계는 이 분기를 도구 호출(tool-calling) 에이전트로 바꾸는 것(마지막 쪽).',
  });

  // ------------------------------------------------------------------ 6. 개인화
  const pz = V.personal || { history: [], tags: [], recs: [] };
  const maxTag = Math.max(1, ...pz.tags.map((t) => t[1]));
  P.push({
    id: 'personal', no: '06', kicker: 'Personalization',
    title: '구매 이력 6건으로 취향을 읽고, LLM이 이유를 말합니다',
    lead: '점수는 <b>코드가 계산</b>하고(같은 사용자 → 같은 후보), LLM은 그 근거를 <b>사람 말로 설명</b>합니다.',
    body: `
    <div class="row fill" style="gap:0;align-items:stretch">
      <div class="card" style="width:340px">
        <div class="h-sec">① 최근 6개월 구매 이력</div>
        <div class="col" style="gap:7px">
          ${pz.history.map((h) => `<div class="row" style="gap:10px;align-items:center">
            <img class="th" style="width:44px;height:44px" src="${asset(h.img)}"/>
            <div style="min-width:0"><div style="font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.name}</div>
            <div class="cap2">${h.date} · ${won(h.price)}</div></div></div>`).join('')}
        </div>
      </div>
      <div class="center" style="width:46px;align-self:center;font-size:22px;color:#b6bdcb">→</div>
      <div class="card" style="width:330px">
        <div class="h-sec">② 패턴 분석 (코드)</div>
        <div class="hbar" style="--lw:72px">
          ${pz.tags.map((t) => `<span>${t[0]}</span><div class="tr"><div class="fl${t[1] === maxTag ? ' hot' : ''}" style="width:${(t[1] / maxTag) * 100}%"></div></div><span class="v">${t[1]}</span>`).join('')}
        </div>
        <div class="col" style="gap:6px;margin-top:16px;font-size:12.5px">
          <div class="row" style="justify-content:space-between"><span class="cap2">가격대</span><b>${pz.price_range ? `${won(pz.price_range[0])} ~ ${won(pz.price_range[1])}` : ''}</b></div>
          <div class="row" style="justify-content:space-between"><span class="cap2">평균 구매가</span><b>${pz.avg_price ? won(Math.round(pz.avg_price)) : ''}</b></div>
          <div class="row" style="justify-content:space-between"><span class="cap2">구매 주기</span><b>분기별</b></div>
          <div class="row" style="justify-content:space-between"><span class="cap2">재구매</span><b>${(pz.repurchase || []).map((x) => `${x.product_name} ×${x.purchase_count}`).join(', ')}</b></div>
        </div>
        <div class="note" style="margin-top:14px;font-size:11.8px">매칭 점수 = 선호 태그 Top-5와 겹치는 수 · 가격대 ±30% · 이미 산 상품 제외</div>
      </div>
      <div class="center" style="width:46px;align-self:center;font-size:22px;color:#b6bdcb">→</div>
      <div class="col grow" style="gap:12px">
        <div class="card">
          <div class="h-sec">③ 추천 후보</div>
          <div class="row" style="gap:12px">
            ${pz.recs.map((p) => `<div style="width:110px"><img class="th" src="${asset(p.img)}"/>
              <div style="font-size:12px;font-weight:700;margin-top:6px;line-height:1.35">${p.name}</div>
              <div class="cap2">매칭 ${p.score}/5 · ${won(p.price)}</div></div>`).join('')}
          </div>
        </div>
        ${shot('chat-personal', { url: '④ LLM의 첫마디', crop: [8, 136, 340, 148] })}
      </div>
    </div>`,
    notes: '구매 이력 → 태그 빈도·가격대·주기·재구매 → 매칭 점수 → LLM이 "요가매트를 두 번 구매하셨고…"처럼 근거를 들어 설명.',
  });

  // ------------------------------------------------------------------ 7. 비전 검색
  const vrow = (v, label) => !v ? '' : `
    <div class="vrow">
      <div><img class="th thq" src="${asset(v.query)}"/><div class="cap2" style="margin-top:6px"><b style="color:var(--rag)">질의</b> ${label}</div></div>
      <div class="varrow"><span>CLIP</span><b>→</b><span>512d<br/>코사인</span></div>
      ${v.items.map((it, i) => `<div><img class="th" src="${asset(it.img)}"/>
        <div class="row" style="justify-content:space-between;align-items:baseline;margin-top:6px">
          <span style="font-size:11.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px">${i + 1}. ${it.name}</span>
          <b style="font-size:13px;color:${i === 0 ? 'var(--rag)' : 'var(--ink)'}">${Math.round(it.sim * 100)}%</b></div>
        <div class="simbar"><div style="width:${it.sim * 100}%;${i ? 'background:#b6bdcb' : ''}"></div></div></div>`).join('')}
    </div>`;
  P.push({
    id: 'vision', no: '07', kicker: 'Vision Search',
    title: '사진 한 장으로 비슷한 상품 찾기',
    lead: `상품 사진은 등록 때 미리 임베딩, 검색은 <b>질의 사진만 한 번</b> 임베딩 → 코사인 유사도. 아래는 <b>카탈로그에 없는 사진</b>으로 검색한 실제 결과입니다.`,
    body: `
    <div class="col" style="gap:16px">
      ${vrow((V.vision || [])[0], '운동화 사진')}
      ${vrow((V.vision || [])[1], '백팩 사진')}
    </div>
    <div class="strip mt-auto" style="margin-top:18px">
      <div><b>5 / 5</b><span>운동화 사진 → 상위 5개 모두 신발</span></div>
      <div><b>1위 ${Math.round(((V.vision || [])[1]?.items[0]?.sim || 0) * 100)}%</b><span>백팩 사진 → ${(V.vision || [])[1]?.items[0]?.name || ''}</span></div>
      <div><b>${M('latency.img_ms')}</b><span>업로드 → 결과 (CPU, 중앙값)</span></div>
      <div><b>43개</b><span>상품 이미지 벡터 (512차원)</span></div>
    </div>`,
    notes: 'CLIP ViT-B/32. 색인 때 대표 이미지 임베딩 저장, 검색 때 같은 인코더로 질의 사진만 임베딩 → RPC로 코사인 유사도 ≥0.3, top-5.',
  });

  // ------------------------------------------------------------------ 8. 선물 마법사
  P.push({
    id: 'gift', no: '08', kicker: 'Structured Output',
    title: 'AI 선물 마법사 — LLM은 번호만 고르고, 상품 정보는 DB가 채웁니다',
    lead: '상품명을 LLM에게 쓰게 하지 않아 <b>존재하지 않는 상품이 추천될 여지를 구조적으로</b> 없앴습니다.',
    body: `
    <div class="row" style="gap:16px">
      <div class="col grow" style="min-width:0">${shot('gift-step1', { url: '① 7단계 질문', crop: [225, 100, 990, 690] })}</div>
      <div class="col grow" style="min-width:0">${shot('gift-loading', { url: '② 후보 분석', crop: [110, 80, 860, 600] })}</div>
      <div class="col grow" style="min-width:0">${shot('gift-result-full', { url: '③ 추천 3개 + 이유 + 메시지', crop: [176, 140, 1088, 760] })}</div>
    </div>
    <div style="margin-top:18px">
    ${dg({
      w: 1160, h: 150,
      nodes: {
        a: { x: 0, y: 30, w: 150, h: 90, t: '7개 답변', s: '관계 · 연령 · 스타일<br/>관심사 · 목적 · 예산' },
        b: { x: 190, y: 30, w: 180, h: 90, t: '의미 기반 후보', s: '조건 문장 ↔ 상품 텍스트<br/>bge-m3 유사도 → 후보 32', k: 'a', tag: '규칙표 → 의미 검색으로 교체' },
        c: { x: 410, y: 20, w: 300, h: 110, k: 'f', t: 'qwen2.5:14b → JSON', html: `<i style="font-family:var(--mono);font-size:11px;margin-top:4px;line-height:1.5">{"rank": 1, "product_number": 10,<br/> "reasons": [3개], "gift_messages": [3톤]}<br/>※ product_name 은 쓰지 말 것</i>` },
        d: { x: 750, y: 30, w: 200, h: 90, t: '번호 → DB 매핑', s: 'products[10-1] →<br/>실제 이름 · 가격 · 이미지', k: 'a' },
        e: { x: 990, y: 30, w: 170, h: 90, t: '추천 카드 3장', s: '+ 이유 3 · 메시지 3톤' },
      },
      edges: [['a', 'b'], ['b', 'c', '후보 32'], ['c', 'd', '번호만', { hot: true }], ['d', 'e']],
    })}
    </div>`,
    notes: 'JSON 스키마 출력 + 코드 펜스·제어문자 제거 후 파싱 + 번호→실상품 매핑. 처음엔 관계/관심사→카테고리 규칙표였으나 조합을 못 잡아 의미 기반 검색으로 교체(2025-12).',
  });

  // ------------------------------------------------------------------ 9. 환각 방지 3겹
  P.push({
    id: 'guard', no: '09', kicker: 'Grounding',
    title: '그럴듯한 오답을 막는 3겹 구조',
    lead: '원칙은 하나 — <b>LLM은 고르고 설명하고, 사실은 DB가 말한다.</b> 틀리면 곤란한 정보(상품명 · 가격 · 규정)는 코드에서 막습니다.',
    body: dg({
      w: 1160, h: 430,
      nodes: {
        q: { x: 0, y: 170, w: 90, h: 90, t: '질문', k: 'c' },
        l1: { x: 124, y: 40, w: 240, h: 350, cls: 'top', k: 'a', t: '1겹 · 검색 게이트', html: `<i style="margin-top:6px">유사도 임계값 미만은<br/>컨텍스트에 넣지 않음</i><div class="big" style="margin-top:26px;font-size:46px">≥ 0.5</div><i>규정 RAG (이미지는 ≥ 0.3)</i><i class="ex2">"오프라인 매장 영업시간"<br/>→ 최고 0.497 → 0건</i>` },
        l2: { x: 398, y: 40, w: 240, h: 350, cls: 'top', k: 'a', t: '2겹 · 프롬프트 범위', html: `<i style="margin-top:6px">근거 안에서만 답하고<br/>모르면 할 말을 정해 둠</i><div class="big" style="margin-top:26px;font-size:46px">${M('eval.refusal')}</div><i>문서 밖 질문 ${M('eval.neg_n')}개 → "찾을 수 없습니다"</i><i class="ex2">"top 3", "3개만" 같은<br/>개수 지정도 지키게 지시</i>` },
        llm: { x: 672, y: 170, w: 100, h: 90, t: 'LLM', s: 'qwen2.5:14b', k: 'f c' },
        l3: { x: 806, y: 40, w: 240, h: 350, cls: 'top', k: 'a', t: '3겹 · 코드 검증', html: `<i style="margin-top:6px">생성 결과를 그대로<br/>화면에 쓰지 않음</i><div class="big" style="margin-top:26px;font-size:46px">0건</div><i>없는 상품 링크 노출</i><i class="ex2">선물: 번호 → DB 매핑<br/>추천 챗: 답변 속 상품명 대조</i>` },
        out: { x: 1080, y: 170, w: 80, h: 90, t: '화면', k: 'c' },
      },
      edges: [['q', 'l1'], ['l1', 'l2'], ['l2', 'llm'], ['llm', 'l3', '', { hot: true }], ['l3', 'out']],
    }),
    notes: '검색 단계(임계값), 프롬프트 단계(범위·거절 문구), 코드 단계(ID 매핑·사후 필터). 프롬프트로 부탁하는 것과 코드로 강제하는 것을 구분.',
  });

  // ------------------------------------------------------------------ 10. 평가
  const cells = Array.from({ length: 24 }, (_, i) => i < 20 ? `<div>✓</div>` : `<div class="neg">✓</div>`).join('');
  P.push({
    id: 'eval', no: '10', kicker: 'Evaluation',
    title: '평가셋 24문항을 직접 만들어 검증했습니다',
    lead: '규정 질문 20개(정답 문서 · 핵심 사실 표시)와 문서에 없는 질문 4개. 실제 API를 호출해 채점하는 스크립트(measure.py)로 언제든 다시 잴 수 있습니다.',
    body: `
    <div class="row fill" style="gap:22px">
      <div class="card" style="width:500px;display:flex;flex-direction:column">
        <div class="h-sec">채점 결과 — 24문항</div>
        <div class="cells">${cells}</div>
        <div class="row" style="gap:18px;margin-top:12px" >
          <span class="cap2"><b style="display:inline-block;width:10px;height:10px;background:var(--rag);border-radius:2px"></b> 규정 질문 20 — 정답 문서 1순위 · 핵심 사실 포함</span>
        </div>
        <div class="row" style="gap:18px;margin-top:4px">
          <span class="cap2"><b style="display:inline-block;width:10px;height:10px;background:#1f232b;border-radius:2px"></b> 문서 밖 질문 4 — "문서에서 찾을 수 없습니다"</span>
        </div>
        <div class="h-sec" style="margin-top:18px">채점 예시 (실제 답변)</div>
        <table class="t" style="font-size:12px">
          <tr><td>단순 변심 반품 배송비?</td><td><b>왕복 6,000원</b> 고객 부담</td><td class="num">✓</td></tr>
          <tr><td>도서산간 추가 배송비?</td><td><b>5,000원</b> 추가</td><td class="num">✓</td></tr>
          <tr><td>향수 개봉 후 반품?</td><td>단순 변심 반품 <b>불가</b></td><td class="num">✓</td></tr>
          <tr><td>멤버십 플러스 적립률?</td><td>1% + 2% = <b>3%</b></td><td class="num">✓</td></tr>
          <tr><td>고객센터 전화번호?</td><td>"문서에서 찾을 수 없습니다"</td><td class="num">✓</td></tr>
        </table>
      </div>
      <div class="col grow" style="gap:14px">
        <div class="g3">
          <div class="card"><div class="big">${M('eval.hit1')}</div><div class="cap2" style="margin-top:6px">Hit@1 — 1순위 청크가 정답 문서</div></div>
          <div class="card"><div class="big">${M('eval.answer_acc')}</div><div class="cap2" style="margin-top:6px">답변 정확도 — 금액·기간 등 핵심 사실</div></div>
          <div class="card"><div class="big">${M('eval.refusal')}</div><div class="cap2" style="margin-top:6px">거절률 — 문서에 없는 질문</div></div>
        </div>
        <div class="g3">
          <div class="card"><div class="big">${M('latency.embed_ms').replace('ms', '')}<small>ms</small></div><div class="cap2" style="margin-top:6px">질문 임베딩 (CPU)</div></div>
          <div class="card"><div class="big">${M('latency.rpc_ms').replace('ms', '')}<small>ms</small></div><div class="cap2" style="margin-top:6px">벡터 검색</div></div>
          <div class="card"><div class="big">${M('latency.ttft_s').replace('s', '')}<small>s</small></div><div class="cap2" style="margin-top:6px">첫 토큰 (로컬 14B)</div></div>
        </div>
        <div class="card" style="padding:12px 14px 6px">
          <div class="h-sec">자동 채점 흐름 — 숫자를 다시 만드는 방법</div>
          ${dg({
            w: 604, h: 96,
            nodes: {
              a: { x: 0, y: 10, w: 120, h: 76, t: '평가셋 24', s: '정답 문서 · 핵심 사실 라벨' },
              b: { x: 160, y: 10, w: 130, h: 76, t: '실제 API 호출', s: '/documents/search (SSE)', k: 'a' },
              c: { x: 330, y: 10, w: 130, h: 76, t: '자동 채점', s: 'Hit@k · 사실 포함 · 거절' },
              d: { x: 500, y: 10, w: 104, h: 76, t: '이 문서', s: 'metrics.json → 빌드', k: 'f' },
            },
            edges: [['a', 'b'], ['b', 'c'], ['c', 'd']],
          })}
        </div>
        <div class="cap2">측정: 로컬 재현 환경 · qwen2.5:14b(RTX 5070, 다른 작업과 GPU 공유) · 시간은 중앙값</div>
      </div>
    </div>`,
    notes: '정답 문서 Hit@k, 핵심 사실 포함 여부, 문서 밖 질문 거절률을 자동 채점. 평가셋이 작고 쉬운 편이라 문서를 늘린 평가가 다음 과제.',
  });

  // ------------------------------------------------------------------ 11. 평가로 찾은 문제
  const tok = MX?.tokens?.raw || [];
  const tmax = 9000;
  P.push({
    id: 'findings', no: '11', kicker: 'What Evaluation Found',
    title: '평가로 찾아낸 문제 2가지 — 원인과 해결 설계까지',
    lead: '같은 질문을 여러 번 돌리고 프롬프트 토큰을 직접 세어 보니, 데모로는 보이지 않던 문제가 드러났습니다.',
    body: `
    <div class="g2 fill">
      <div class="card" style="display:flex;flex-direction:column">
        <div class="h-sec">① 상품명 환각</div>
        ${shot('chat-personal', { url: '개인화 답변 — 카탈로그에 없는 상품', crop: [0, 296, 480, 190], boxes: [[2, 2, 62, 21]] })}
        <div class="hbar" style="--lw:110px;margin-top:14px">
          <span>개인화 질문</span><div class="tr"><div class="fl hot" style="width:100%"></div></div><span class="v">${M('halluc.개인화')}회</span>
          <span>키워드 질문</span><div class="tr"><div class="fl" style="width:2%"></div></div><span class="v">${M('halluc.키워드')}회</span>
        </div>
        <p style="font-size:12.8px;line-height:1.6;margin:12px 0 0;color:var(--ink-2)"><b>원인</b> 개인화 프롬프트에만 "목록에서 고르라"는 제약이 없고, 기구매 제외 후 후보가 2개뿐 → 모델이 그럴듯한 상품을 생성.<br/>
        <b>해결</b> 선물 마법사처럼 <b>번호(ID)로 받고 DB가 채우기</b> + 답변 속 상품명 검증.</p>
      </div>
      <div class="card" style="display:flex;flex-direction:column">
        <div class="h-sec">② 프롬프트 잘림 — 컨텍스트 4,096 토큰</div>
        <div class="hbar" style="--lw:170px;row-gap:9px;position:relative">
          ${tok.map(([n, v]) => `<span style="font-size:12px">${n.replace(/ \(.*\)/, '')}</span><div class="tr"><div class="fl${v > 4096 ? ' hot' : ''}" style="width:${Math.min(100, (v / tmax) * 100)}%"></div><div style="position:absolute;left:${(4096 / tmax) * 100}%;top:-4px;bottom:-4px;border-left:2px dashed #1f232b"></div></div><span class="v" style="font-size:12px">${v.toLocaleString()}</span>`).join('')}
        </div>
        <div style="height:14px"></div>
        ${py(`msg="truncating input prompt" prompt=4123 → new=2050
slot context shift, n_discard = 2045   # 선물 JSON 생성 중`, 'Ollama server.log', false, 'sm')}
        <p style="font-size:12.8px;line-height:1.6;margin:10px 0 0;color:var(--ink-2)"><b>원인</b> 창 크기를 지정하지 않아 4,096으로 동작 → 넘치면 앞부분(지시문·상품 목록)이 버려짐.<br/>
        <b>해결</b> <span class="mono">num_ctx</span> 지정(모델은 32K) · 후보 50 → 15로 압축 · 리뷰는 1줄 요약.</p>
      </div>
    </div>`,
    notes: '개인화 3회 중 3회 카탈로그에 없는 상품 생성(키워드 0/3). 쇼핑 챗 기본 경로 8,879 토큰으로 4,096 창 초과 — Ollama 로그로 잘림 확인. 각각 원인과 해결 설계.',
  });

  // ------------------------------------------------------------------ 12. 다음 단계 · 연락처
  P.push({
    id: 'next', no: '12', kicker: 'Next · RAG Agent',
    title: '다음 단계 — 규칙 기반 라우터를 RAG 에이전트로',
    lead: '지금의 if-else 분기를 <b>모델이 도구를 고르고, 결과를 검증하는</b> 구조로 바꿉니다. 이미 만든 함수들이 그대로 도구가 됩니다.',
    body: `
    ${dg({
      w: 1160, h: 380,
      nodes: {
        now: { x: 0, y: 120, w: 200, h: 140, k: 'g', t: '지금', html: `<i style="margin-top:8px;color:var(--ink-2)">키워드 / 로그인 여부로<br/>if-else 분기<br/><br/>→ 정해진 경로만 탐색</i>` },
        ag: { x: 420, y: 135, w: 230, h: 110, k: 'f c', t: 'RAG 에이전트', s: 'LangGraph · 도구 선택<br/>결과 검증 · 재시도' },
        t1: { x: 790, y: 0, w: 370, h: 56, k: 'a', t: 'search_policy(query)', s: '규정 RAG — 출처와 함께 반환' },
        t2: { x: 790, y: 72, w: 370, h: 56, k: 'a', t: 'search_products(filters)', s: '태그 · 가격 · 평점 조건 검색' },
        t3: { x: 790, y: 144, w: 370, h: 56, k: 'a', t: 'get_user_pattern(user_id)', s: '구매 패턴 요약 (개인화)' },
        t4: { x: 790, y: 216, w: 370, h: 56, k: 'a', t: 'find_similar_images(image)', s: 'CLIP 이미지 검색' },
        t5: { x: 790, y: 288, w: 370, h: 56, t: 'get_order_status(order_id)', s: '주문 · 배송 조회 — 새 도구' },
        ver: { x: 420, y: 300, w: 230, h: 66, t: '답변 검증', s: '카탈로그 · 출처와 대조 → 실패 시 재생성' },
      },
      edges: [['now', 'ag', '바꾸기', { hot: true }],
        ['ag', 't1', '', { a: 'r', b: 'l', xm: 730 }], ['ag', 't2', '', { a: 'r', b: 'l', xm: 730 }], ['ag', 't3', '', { a: 'r', b: 'l', xm: 730 }],
        ['ag', 't4', '', { a: 'r', b: 'l', xm: 730 }], ['ag', 't5', '', { a: 'r', b: 'l', xm: 730, dash: true }], ['ag', 'ver', '', { a: 'b', b: 't' }]],
    })}
    <div class="strip" style="margin-top:14px">
      <div><b style="font-size:17px">${META.name}</b><span>${META.role} · ${META.career}</span></div>
      <div><b style="font-size:15px">AI 쇼핑몰</b><span>${META.project}</span></div>
      <div><b style="font-size:15px">${META.repo}</b><span>프로젝트 저장소</span></div>
    </div>`,
    notes: '지원 직무(RAG 에이전트)와 연결. 파란 테두리 도구 4개는 이미 구현된 함수, 점선은 새로 만들 도구.',
  });

  return P;
}
