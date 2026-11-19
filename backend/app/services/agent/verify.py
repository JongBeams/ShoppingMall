"""
답변 검증 — 평가에서 찾은 문제를 생성 후 단계에서 막습니다.

1. 상품 번호: [P#] 가 이번 대화의 도구 결과에 실제로 있는지
2. 상품명 환각: 번호 없이 굵게/번호 목록/따옴표로 제시한 '상품명처럼 생긴 것' 이 카탈로그에 없는지
3. 언어 혼입: 한국어 답변에 한자(중국어)가 섞였는지
4. 의도 누락: 추천 · 실행(취소 · 담기 · 상담원) 요청인데 해당 도구를 부르지 않았는지
5. 거짓 실행 보고: 실제로 실행되지 않은 일을 "담았습니다 · 취소했습니다"라고 말하는지
6. 형식 누출 · 빈 답변: 도구 호출 JSON 이 답변에 남았거나 답변이 비었는지
7. 수치 대조: 상품 하나를 말하는 문장의 평점 · 가격이 DB 값과 같은지
"""
import re
from typing import Dict, List, Tuple

TAG = re.compile(r"\[(P\d+)\]")
CJK = re.compile(r"[一-鿿]")
TOOL_LEAK = re.compile(r"</?tool_call>|\"(arguments|action|name)\"\s*:")
# 실행을 마쳤다고 말하는 표현 — 이번 턴에 실제 실행이 없으면 거짓 보고
ACTION_CLAIM = re.compile(r"담았|담아\s*드렸|취소했|취소되었|취소 완료|취소 처리했|등록했|등록되었|접수했|접수되었|연결했|연결해\s*드렸")


def product_like_names(text: str) -> List[str]:
    """번호 없이 상품처럼 제시된 이름 (굵게 · 번호 목록 제목 · 따옴표+괄호)"""
    names = []
    for m in re.finditer(r"\*\*([^*\n]{2,40})\*\*", text):
        names.append(m.group(1).strip())
    for line in text.splitlines():
        m = re.match(r"^\s*\d+\.\s*\**\s*([^*:\n\[]{2,40}?)\s*\**\s*$", line)
        if m:
            names.append(m.group(1).strip())
    names += [q.strip() for q in re.findall(r"'([^'\n]{3,40})'", text)
              if (" " in q.strip() or "(" in q) and not re.search(r"[.,!?]", q)]  # 따옴표 사이 문장 조각 제외
    # 라벨·문장 조각 제외
    return [n for n in dict.fromkeys(names) if not n.endswith(":") and not TAG.search(n) and len(n.split()) <= 6]


RECOMMEND = re.compile(r"추천|골라|어울리|뭐\s*살|사고\s*싶|싼\s*거|저렴한\s*거|비슷한\s*(거|상품)|다른\s*(거|상품)")
# 실행 요청 → 불러야 할 도구 (취소는 주문 조회만 해도 됨 — 결과를 보고 취소 가능 여부를 설명할 수 있으므로)
ACTION_INTENT = {
    "cancel_order": re.compile(r"취소\s*해|취소하고\s*싶|취소할래|취소\s*부탁|취소\s*(실행|처리)"),
    "add_to_cart": re.compile(r"담아|장바구니에\s*(넣|추가)"),
    "request_human": re.compile(r"(상담원|상담사)\S{0,2}\s*(연결|불러|바꿔|통화)|사람(이랑|하고|과)\s*(통화|얘기|이야기|연결)|연결\s*해"),
}
ACTION_LOOKUP = {"cancel_order": "get_order_status"}
# 주문 · 배송 조회 요청 — 주문번호 없이도 최근 주문을 볼 수 있으므로 되묻지 말고 조회해야 함
# "확인하겠습니다"라고만 하고 도구를 부르지 않은 답 (약속만 하고 멈춤)
PROMISE = re.compile(r"(확인|조회|검색|찾아\s*보|알아\s*보|살펴\s*보)(해\s*)?(하)?겠습니다|(확인|조회)해\s*보겠")
POLICY = re.compile(r"배송비|반품|교환|환불|포인트|적립|쿠폰|유효기간|멤버십|기한|규정|약관")
DOC_CITE = re.compile(r"\.pdf$|규정|약관|정책|안내서")  # [교환_반품_환불_규정.pdf] 같은 출처 표기 — 상품 자리 아님
ORDER_LOOKUP = re.compile(r"어디쯤|배송\s*(상태|조회|현황|추적)|주문\s*(상태|조회|내역|확인)|운송장|언제\s*(와|도착|받|오)")
# 도구 대신 말로 실행 여부를 되묻는 표현 ("취소할까요?") — 확인은 도구(확인 카드)가 하므로 말로 묻지 않음
ASK_INSTEAD = re.compile(r"(취소|진행|담아|연결)\S{0,6}(까요|겠습니까|시겠어요|드릴까)")  # 실행 대신 확인만 해도 되는 조회 도구
PERSONAL = re.compile(r"어울리|내\s*취향|평소|나한테|나에게|내게")  # 개인화 추천 → get_user_pattern
PRODUCT_TOOLS = {"search_products", "get_user_pattern"}
TOOL_NAMES = {"search_policy", "search_products", "get_user_pattern", "get_order_status",
              "add_to_cart", "cancel_order", "request_human"}


RATING = re.compile(r"평점\s*(?:은|는|이|:)?\s*(\d(?:\.\d)?)(?!\s*(이상|이하|점\s*이상))")
PRICE = re.compile(r"(\d{1,3}(?:,\d{3})+|\d{4,})\s*원(?!\s*(이하|이상|미만|초과|보다|까지|대))")


def number_mismatches(answer: str, catalog: Dict[str, Dict]) -> List[str]:
    """상품 하나만 말하는 문장에서 평점 · 가격이 실제 값과 다른 것 (조건 · 배송비 문장은 제외)"""
    out = []
    for sent in re.split(r"(?<=[.!?])\s+|\n+", answer):
        pids = set(TAG.findall(sent)) | {k for k, p in catalog.items() if p.get("name") and p["name"] in sent}
        pids = [k for k in pids if k in catalog]
        if len(pids) != 1 or "배송" in sent:
            continue
        pid, p = pids[0], catalog[pids[0]]
        for m in RATING.finditer(sent):
            if p.get("rating") is not None and abs(float(m.group(1)) - float(p["rating"])) > 0.05:
                out.append(f"[{pid}] 평점 {m.group(1)} (실제 {float(p['rating']):.1f})")
        prices = [int(x.replace(",", "")) for x in PRICE.findall(sent) for x in [x[0] if isinstance(x, tuple) else x]]
        if len(prices) == 1 and p.get("price") and prices[0] != int(float(p["price"])):
            out.append(f"[{pid}] 가격 {prices[0]:,}원 (실제 {int(float(p['price'])):,}원)")
    return out


def _is_fact(text: str, facts: str) -> bool:
    """도구 결과에 그대로 있는 문자열(주문번호 · 파일명 · 상태 등)은 사실로 인정"""
    return bool(facts) and len(text) >= 2 and text in facts


def check(answer: str, catalog: Dict[str, Dict], known_names: set,
          question: str = "", called: List[str] = (), facts: str = "",
          can_act: bool = False, executed: bool = False) -> Tuple[bool, List[str]]:
    """(통과 여부, 문제 목록). facts = 이번 턴의 도구 결과 원문,
    can_act = 실행 도구를 쓸 수 있는 고객(로그인), executed = 이번 턴에 실제로 실행된 작업이 있는지"""
    problems = []
    if not answer.strip():
        return False, ["빈 답변"]
    unknown_tags = [t for t in TAG.findall(answer) if t not in catalog]
    if unknown_tags:
        problems.append(f"도구 결과에 없는 상품 번호 {', '.join(sorted(set(unknown_tags)))}")
    # [러닝화] 처럼 번호가 아닌 대괄호 — 도구 결과 없이 상품 자리를 채우려 한 흔적
    # (도구 이름 표기와 [ORD-…] 처럼 도구 결과에 있는 값은 제외 — render 에서 정리)
    loose = [t for t in re.findall(r"\[([^\]\n]{1,30})\]", answer)
             if not re.fullmatch(r"P\d+", t) and t not in TOOL_NAMES and not _is_fact(t, facts) and not DOC_CITE.search(t)]
    if loose:
        problems.append(f"상품 번호가 아닌 표기 [{loose[0]}]")
    # 추천을 요청했는데 상품 도구를 한 번도 부르지 않음
    if question and RECOMMEND.search(question) and not (set(called) & PRODUCT_TOOLS):
        problems.append("추천 요청인데 상품 도구(search_products 또는 get_user_pattern)를 호출하지 않음")
    # 실행을 요청했는데 해당 도구(또는 확인용 조회 도구)를 부르지 않음 — 되묻기 · 말로만 처리
    if question and can_act:
        for tool, pat in ACTION_INTENT.items():
            if not pat.search(question) or tool in called:
                continue
            if ACTION_LOOKUP.get(tool) not in called:
                problems.append(f"실행 요청인데 {tool} 도구를 호출하지 않음")
            elif tool == "cancel_order" and '"cancellable": true' in facts and ASK_INSTEAD.search(answer):
                # 조회만 하고 "취소할까요?"로 멈춤 — 취소할 수 있는 주문이 있는데 도구 대신 말로 되물음
                # ("배송 중이라 취소할 수 없습니다" 같은 안내는 정상이므로 걸리지 않음)
                problems.append("실행 요청인데 cancel_order 도구를 호출하지 않음 (말로 되물음)")
    if question and can_act and ORDER_LOOKUP.search(question) and "get_order_status" not in called:
        problems.append("조회 요청인데 get_order_status 도구를 호출하지 않음")
    if PROMISE.search(answer) and not called:
        problems.append("확인하겠다고만 하고 도구를 호출하지 않음")
    # 실행하지 않은 일을 했다고 말함 (문서 속 지시를 따르거나, 확인 전에 완료라고 말하는 경우)
    claims = [m.group(0) for m in ACTION_CLAIM.finditer(answer)]
    # 조회 결과를 전하는 경우는 제외 (예: 주문 상태가 이미 '주문 취소')
    claims = [c for c in claims if not (c.startswith("취소") and "주문 취소" in facts)]
    if not executed and claims:
        problems.append("실행되지 않은 작업을 완료했다고 말함")
    fakes = [n for n in product_like_names(answer) if n not in known_names and not _is_fact(n, facts)
             and not any(n in v["name"] or v["name"] in n for v in catalog.values())]
    # 상품처럼 보이지만 카탈로그 이름과도 겹치지 않는 것만 — 일반 소제목은 길이·형태로 대부분 걸러짐
    fakes = [n for n in fakes if re.search(r"\(|\d|[A-Za-z]", n) or len(n) >= 8]
    if fakes:
        problems.append(f"카탈로그에 없는 상품명 {', '.join(fakes[:3])}")
    wrong = number_mismatches(answer, catalog)
    if wrong:
        problems.append(f"상품 정보와 다른 수치 {', '.join(wrong[:2])}")
    if CJK.search(answer):
        problems.append("한국어 답변에 한자/중국어가 섞임")
    # 도구 호출 형식이 답변으로 새어 나온 경우 (복구하지 못한 tool_call 텍스트)
    if TOOL_LEAK.search(answer):
        problems.append("도구 호출 형식이 답변에 그대로 나옴")
    return (not problems, problems)


def feedback_message(problems: List[str]) -> str:
    return ("[검증 실패] " + " / ".join(problems) + "\n"
            "원래 질문의 요청을 빠짐없이 모두 다시 답하세요 (앞 답변에서 맞은 내용은 유지). "
            "필요하면 도구를 호출한 뒤 다시 작성하세요. 상품은 반드시 도구 결과의 [P번호]로만 언급하고, "
            "도구 결과에 없는 상품은 만들지 마세요. 한국어로만 답하세요.")


PARTICLES = {"은": ("은", "는"), "는": ("은", "는"), "이": ("이", "가"), "가": ("이", "가"),
             "을": ("을", "를"), "를": ("을", "를"), "과": ("과", "와"), "와": ("과", "와")}


def _has_batchim(name: str) -> bool:
    """이름의 마지막 한글 음절에 받침이 있는지 — '러닝화 (레드)' → '드' → 없음"""
    for ch in reversed(name):
        if "가" <= ch <= "힣":
            return (ord(ch) - 0xAC00) % 28 != 0
    return False


def render(answer: str, catalog: Dict[str, Dict], facts: str = "") -> Tuple[str, List[str]]:
    """[P#] → 실제 상품명 (뒤 조사도 이름에 맞게). 답변에 쓰인 순서대로 상품 번호 목록도 돌려줌."""
    used = []
    # [ORD-…] 처럼 도구 결과 값을 대괄호로 감싼 경우 괄호만 벗김
    answer = re.sub(r"\[([^\]\n]{2,30})\]",
                    lambda m: m.group(1) if not re.fullmatch(r"P\d+", m.group(1)) and _is_fact(m.group(1), facts)
                    else m.group(0), answer)
    # 모델이 번호와 이름을 같이 쓴 경우 ("[P1] 상품명", "상품명 [P1]", "상품명([P1])") → 번호 하나로
    for pid, p in catalog.items():
        name = re.escape(p["name"])
        answer = re.sub(rf"\[{pid}\]\s*['\"*]*{name}['\"*]*", f"[{pid}]", answer)
        answer = re.sub(rf"['\"*]*{name}['\"*]*\s*\(?\[{pid}\]\)?", f"[{pid}]", answer)

    def sub(m):
        pid, josa = m.group(1), m.group(2)
        p = catalog.get(pid)
        if not p:
            return josa
        if pid not in used:
            used.append(pid)
        if josa in PARTICLES:
            josa = PARTICLES[josa][0 if _has_batchim(p["name"]) else 1]
        return f"'{p['name']}'{josa}"

    # 출처 표기 [교환_반품_환불_규정.pdf] → 괄호 없이 (출처는 화면의 '참고'에도 따로 표시)
    answer = re.sub(r"\[([^\]\n]{2,40})\]", lambda m: m.group(1) if DOC_CITE.search(m.group(1)) and not re.fullmatch(r"P\d+", m.group(1))
                    else m.group(0), answer)
    text = re.sub(r"\[(P\d+)\]([은는이가을를과와]?)", sub, answer)
    # 모델이 근거 대신 도구 이름을 적은 경우 제거 (출처는 화면의 '참고'에 따로 표시)
    text = re.sub(r"\s*[\[(](?:search_policy|search_products|get_user_pattern|get_order_status|add_to_cart|cancel_order|request_human)[\])]", "", text)
    text = re.sub(r"'([^']+)'\s*'\1'", r"'\1'", text)  # 모델이 이름과 번호를 함께 쓴 경우 중복 제거
    return text.strip(), used


def sanitize(answer: str, catalog: Dict[str, Dict], problems: List[str],
             question: str = "", facts: str = "") -> str:
    """검증 실패한 답변에서 확인할 수 없는 문장만 제거하고, 추천 질문이었다면 안내를 덧붙임"""
    sentences = re.split(r"(?<=[.!?。])\s+|\n+", answer)
    keep = []
    for s_ in sentences:
        bad_tag = any(t not in catalog for t in TAG.findall(s_))
        loose = any(not re.fullmatch(r"P\d+", t) and t not in TOOL_NAMES and not _is_fact(t, facts)
                    for t in re.findall(r"\[([^\]\n]{1,30})\]", s_))
        if s_.strip() and not bad_tag and not loose and not CJK.search(s_):
            keep.append(s_.strip())
    text = " ".join(keep)
    if RECOMMEND.search(question or "") and any("상품" in p for p in problems):
        text += ("\n\n" if text else "") + "상품 추천은 검색 결과로 확인하지 못해 답변에서 제외했습니다. 다시 질문해 주시면 확인해 드리겠습니다."
    return text.strip() or "죄송합니다. 확인된 정보만으로 답하기 어렵습니다. 질문을 조금 바꿔 다시 시도해 주세요."
