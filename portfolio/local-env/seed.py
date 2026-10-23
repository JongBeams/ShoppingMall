"""
로컬 재현 DB 에 데모 데이터를 넣습니다. (setup_db.py → start.py 실행 후)

  python seed.py

1) 계정·판매자·카테고리·상품·주문·리뷰·공지·FAQ 를 SQL 로 넣고
2) 상품 이미지 임베딩은 backend 의 ImageEmbeddingService(CLIP ViT-B/32) 로 실제 계산하고
3) RAG 문서는 실행 중인 백엔드의 POST /documents/upload 로 올려
   (PDF 추출 → LangChain 청킹 → bge-m3 임베딩 → 저장) 실제 파이프라인을 그대로 탑니다.

상품 사진: Unsplash (무료 라이선스) — 원본 서비스 DB 가 내려가 데모용으로 다시 구성한 카탈로그입니다.
"""
import json
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import psycopg2
import psycopg2.extras
import requests

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CACHE = HERE / ".cache"
CFG = json.loads((CACHE / "local.json").read_text(encoding="utf-8"))
P = CFG["ports"]
BACKEND = f"http://127.0.0.1:{P['backend']}"
ASSETS = HERE / "assets"
NOW = datetime.now(timezone.utc).replace(microsecond=0)
random.seed(20261023)
psycopg2.extras.register_uuid()


def unsplash(pid, w=800):
    return f"https://images.unsplash.com/photo-{pid}?w={w}&q=80"


def download(pid, w=800) -> Path:
    """이미지를 .cache/images 에 받아 둡니다 (재시도 포함)."""
    f = CACHE / "images" / f"{pid}_{w}.jpg"
    f.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(5):
        if f.exists() and f.stat().st_size > 1000:
            return f
        try:
            r = requests.get(unsplash(pid, w), timeout=30)
            r.raise_for_status()
            f.write_bytes(r.content)
        except requests.RequestException:
            if attempt == 4:
                raise
    return f


# ------------------------------------------------------------------ 기본 데이터
CATEGORIES = [
    ("패션", "fashion"), ("전자제품", "electronics"), ("뷰티", "beauty"), ("생활", "living"),
    ("식품", "food"), ("스포츠", "sports"), ("도서", "books"), ("완구", "toys"),
]

VENDORS = {
    "urban": ("어반스텝", "운동화·스니커즈·캐주얼 의류 편집숍", "seller.urban@example.com", "박도현"),
    "sound": ("사운드랩", "음향·디지털 기기 전문 스토어", "seller.sound@example.com", "한서준"),
    "mood": ("데일리무드", "향·스킨케어·리빙 셀렉트숍", "seller.mood@example.com", "오지민"),
}

# (unsplash id, 이름, 카테고리 slug, 판매자, 가격, 태그, 설명, 목표 판매량)
PRODUCTS = [
    ("1542291026-7eec264c27ff", "에어 플로우 러닝화 (레드)", "sports", "urban", 119000,
     ["러닝화", "운동화", "러닝", "운동", "스포츠"], "니트 갑피와 반응형 쿠션 미드솔로 장거리 러닝에도 발이 편한 경량 러닝화입니다.", 46),
    ("1606107557195-0e29a4b5b4aa", "라이트핏 트레이닝화 (네온)", "sports", "urban", 99000,
     ["트레이닝화", "운동화", "러닝화", "헬스", "운동"], "넓은 접지면과 측면 지지대로 실내 웨이트·크로스핏에 맞춘 트레이닝화입니다.", 31),
    ("1600185365483-26d7a4cc7519", "쿠션 에어 러닝화 (화이트)", "sports", "urban", 139000,
     ["러닝화", "운동화", "쿠션", "러닝"], "뒤꿈치 에어 유닛이 충격을 흡수해 초보 러너에게 추천하는 쿠셔닝 러닝화입니다.", 27),
    ("1549298916-b41d501d3772", "캔버스 하이 스니커즈 (브라운)", "fashion", "urban", 89000,
     ["스니커즈", "운동화", "캐주얼", "데일리"], "왁스 코팅 캔버스 소재로 가을·겨울 데일리룩에 잘 어울리는 스니커즈입니다.", 22),
    ("1595950653106-6c9ebd614d3a", "파스텔 플랫폼 스니커즈", "fashion", "urban", 109000,
     ["스니커즈", "운동화", "여성", "파스텔", "캐주얼"], "3.5cm 플랫폼 솔과 파스텔 컬러 블록으로 키높이 효과를 주는 스니커즈입니다.", 18),
    ("1608231387042-66d1773070a5", "클래식 레더 스니커즈 (화이트)", "fashion", "urban", 79000,
     ["스니커즈", "운동화", "화이트", "미니멀", "데일리"], "군더더기 없는 화이트 레더 스니커즈. 어떤 코디에도 무난한 기본템입니다.", 38),
    ("1525966222134-fcfa99b8ae77", "캔버스 로우 스니커즈 (버건디)", "fashion", "urban", 65000,
     ["스니커즈", "캐주얼", "빈티지"], "사이드 라인 포인트가 들어간 클래식 캔버스 로우탑입니다.", 14),
    ("1614252235316-8c857d38b5f4", "옥스퍼드 가죽 구두", "fashion", "urban", 159000,
     ["구두", "정장", "가죽", "남성"], "소가죽 통가죽 갑피와 굿이어 웰트 공법으로 만든 옥스퍼드 구두입니다.", 9),
    ("1560343090-f0409e92791a", "스웨이드 더비 슈즈 (그린)", "fashion", "urban", 129000,
     ["구두", "빈티지", "가죽"], "부드러운 스웨이드에 그린 컬러로 포인트를 준 더비 슈즈입니다.", 6),
    ("1551028719-00167b16eac5", "라이더 레더 자켓", "fashion", "urban", 249000,
     ["자켓", "아우터", "가죽", "남성", "겨울"], "램스킨 소재 라이더 자켓. 비대칭 지퍼와 벨트 디테일이 특징입니다.", 8),
    ("1521572163474-6864f9cf17ab", "오가닉 코튼 반팔 티셔츠 (화이트)", "fashion", "urban", 29000,
     ["티셔츠", "반팔", "기본템", "미니멀", "데일리"], "오가닉 코튼 20수 원단으로 비침이 적은 화이트 티셔츠입니다.", 52),
    ("1618354691373-d851c5c3a990", "오버핏 로고 반팔 티셔츠 (블랙)", "fashion", "urban", 35000,
     ["티셔츠", "반팔", "캐주얼"], "드롭 숄더 오버핏에 작은 원형 로고 프린트가 들어간 티셔츠입니다.", 24),
    ("1539533018447-63fcce2678e3", "울 블렌드 벨티드 코트", "fashion", "urban", 219000,
     ["코트", "아우터", "겨울", "여성", "미니멀"], "울 60% 블렌드 원단의 벨티드 롱코트. 허리 벨트로 실루엣을 잡아줍니다.", 11),
    ("1591047139829-d91aecb6caea", "MA-1 봄버 자켓 (브라운)", "fashion", "urban", 119000,
     ["자켓", "아우터", "캐주얼"], "가벼운 나일론 소재 봄버 자켓. 간절기에 걸치기 좋습니다.", 13),
    ("1544022613-e87ca75a784a", "오버핏 필드 자켓 (카키)", "fashion", "urban", 139000,
     ["자켓", "아우터", "캐주얼", "빈티지"], "4포켓 밀리터리 디테일의 워싱 코튼 필드 자켓입니다.", 10),
    ("1593030761757-71fae45fa0e7", "조거 트레이닝 세트 (옐로우)", "sports", "urban", 69000,
     ["트레이닝복", "운동", "홈트", "캐주얼"], "기모 없는 쭈리 원단 크롭 후디 + 조거 팬츠 세트입니다.", 19),
    ("1584917865442-de89df76afd3", "미니 토트백 (레드)", "fashion", "mood", 159000,
     ["가방", "토트백", "여성", "선물"], "사피아노 레더 미니 토트백. 탈부착 스트랩으로 크로스백 연출이 가능합니다.", 12),
    ("1590874103328-eac38a683ce7", "라탄 핸드백", "fashion", "mood", 79000,
     ["가방", "여름", "여성", "빈티지"], "수작업 라탄 바디에 가죽 플랩을 더한 여름 핸드백입니다.", 7),
    ("1553062407-98eeb64c6a62", "데일리 백팩 (네이비)", "fashion", "urban", 69000,
     ["가방", "백팩", "노트북", "데일리"], "15인치 노트북 수납, 생활방수 원단의 데일리 백팩입니다.", 29),
    ("1572635196237-14b3f281503f", "클래식 스퀘어 선글라스", "fashion", "mood", 89000,
     ["선글라스", "여름", "액세서리"], "UV400 편광 렌즈의 클래식 스퀘어 프레임 선글라스입니다.", 15),
    ("1511499767150-a48a237f0083", "라운드 메탈 선글라스", "fashion", "mood", 79000,
     ["선글라스", "액세서리", "빈티지"], "얇은 메탈 브리지의 라운드 선글라스. 그린 틴트 렌즈입니다.", 9),
    ("1524592094714-0f0654e20314", "미니멀 가죽 시계", "fashion", "mood", 129000,
     ["시계", "액세서리", "선물", "미니멀"], "36mm 슬림 케이스와 이탈리안 가죽 스트랩의 미니멀 시계입니다.", 17),
    ("1522312346375-d1a52e2b99b3", "로즈골드 크로노그래프 시계", "fashion", "mood", 239000,
     ["시계", "선물", "기념일"], "로즈골드 케이스 크로노그래프. 기념일 선물로 인기가 많습니다.", 8),
    ("1505740420928-5e560c06d30e", "노이즈캔슬링 무선 헤드폰", "electronics", "sound", 189000,
     ["헤드폰", "무선", "음악", "노이즈캔슬링", "전자기기"], "하이브리드 ANC와 30시간 배터리, 멀티포인트 연결을 지원하는 무선 헤드폰입니다.", 41),
    ("1484704849700-f032a568e944", "스튜디오 모니터링 헤드폰", "electronics", "sound", 149000,
     ["헤드폰", "음악", "유선"], "플랫한 응답 특성의 밀폐형 모니터링 헤드폰입니다.", 9),
    ("1590658268037-6bf12165a8df", "무선 이어버드 프로", "electronics", "sound", 129000,
     ["이어폰", "무선", "음악", "운동"], "IPX4 방수와 노이즈캔슬링, 무선 충전 케이스를 갖춘 이어버드입니다.", 36),
    ("1546868871-7041f2a55e12", "스마트워치 액티브 (블랙)", "electronics", "sound", 159000,
     ["스마트워치", "운동", "헬스", "전자기기"], "심박·수면·러닝 기록과 GPS를 지원하는 스마트워치입니다.", 23),
    ("1526170375885-4d8ecf77b99f", "인스턴트 카메라", "electronics", "sound", 139000,
     ["카메라", "사진", "선물", "여행"], "찍는 즉시 인화되는 인스턴트 카메라. 셀피 미러와 자동 노출을 지원합니다.", 14),
    ("1587829741301-dc798b83add3", "무선 슬림 키보드", "electronics", "sound", 69000,
     ["키보드", "사무용", "전자기기"], "블루투스 3대 멀티페어링, 저소음 펜타그래프 키보드입니다.", 21),
    ("1527864550417-7fd91fc51a46", "무소음 무선 마우스", "electronics", "sound", 29000,
     ["마우스", "사무용", "전자기기"], "클릭음을 90% 줄인 무소음 무선 마우스입니다.", 33),
    ("1608043152269-423dbba4e7e1", "방수 블루투스 스피커", "electronics", "sound", 99000,
     ["스피커", "무선", "음악", "캠핑", "여행"], "IP67 방수, 12시간 재생의 휴대용 블루투스 스피커입니다.", 16),
    ("1592945403244-b3fbafd7f539", "로즈 블룸 오 드 퍼퓸 50ml", "beauty", "mood", 98000,
     ["향수", "플로럴", "여성", "선물", "기념일"], "다마스크 로즈와 피오니가 어우러진 플로럴 향수입니다.", 26),
    ("1608528577891-eb055944f2e7", "우디 머스크 오 드 뚜왈렛", "beauty", "mood", 89000,
     ["향수", "남성", "우디", "선물"], "시더우드와 머스크 베이스의 차분한 우디 향수입니다.", 15),
    ("1620916566398-39f1143ab7be", "데일리 수분 크림", "beauty", "mood", 32000,
     ["스킨케어", "크림", "보습"], "세라마이드와 판테놀로 속건조를 잡아주는 데일리 수분 크림입니다.", 44),
    ("1631214540553-ff044a3ff1d4", "롱래쉬 마스카라", "beauty", "mood", 21000,
     ["메이크업", "마스카라"], "번짐 없는 워터프루프 롱래쉬 마스카라입니다.", 20),
    ("1514228742587-6b1558fcca3d", "세라믹 머그컵 (화이트)", "living", "mood", 15000,
     ["머그컵", "주방", "미니멀", "선물"], "무광 유약의 350ml 세라믹 머그컵입니다.", 37),
    ("1603006905003-be475563bc59", "우드윅 소이 캔들", "living", "mood", 32000,
     ["캔들", "인테리어", "향", "선물", "힐링"], "타닥타닥 소리가 나는 우드윅 소이 캔들. 연소 시간 약 45시간입니다.", 30),
    ("1507473885765-e6ed057f782c", "북유럽 스탠드 조명", "living", "mood", 89000,
     ["조명", "인테리어", "미니멀"], "각도 조절 헤드의 북유럽풍 플로어 스탠드입니다.", 7),
    ("1598300042247-d088f8ab3a91", "패브릭 라운지 체어 (그레이)", "living", "mood", 179000,
     ["의자", "인테리어", "가구"], "원목 다리와 그레이 패브릭의 1인 라운지 체어입니다.", 5),
    ("1559056199-641a0ac8b55e", "싱글오리진 원두 500g", "food", "mood", 24000,
     ["커피", "원두", "홈카페"], "에티오피아 예가체프 싱글오리진. 주문 후 로스팅해 발송합니다.", 48),
    ("1564890369478-c89ca6d9cde9", "제주 유기농 녹차 세트", "food", "mood", 36000,
     ["차", "녹차", "선물", "건강"], "제주 유기농 첫물차와 다기 세트입니다.", 12),
    ("1601925260368-ae2f83cf8b7f", "논슬립 요가매트 8mm", "sports", "urban", 39000,
     ["요가", "요가매트", "홈트", "운동", "헬스"], "양면 논슬립 TPE 소재, 8mm 두께의 요가매트입니다.", 34),
    ("1558060370-d644479cb6f7", "레트로 틴 로봇 피규어", "toys", "mood", 45000,
     ["장난감", "피규어", "빈티지", "선물"], "태엽으로 걷는 레트로 감성 틴 로봇 피규어입니다.", 6),
]

# 이미지 검색 질의용 (카탈로그에 없는 사진)
QUERY_IMAGES = {
    "query_sneaker.jpg": "1600269452121-4f2416e55c28",
    "query_backpack.jpg": "1622560480605-d83c853bc5c3",
}

REVIEWERS = ["김민준", "이서연", "박지호", "최유나", "정하린", "강도윤", "윤서아", "장예준", "임채원", "송지우"]

HEADPHONE_REVIEWS = [
    (5, "노이즈캔슬링 성능이 정말 좋아요. 지하철에서도 음악에만 집중할 수 있어요. 배터리도 이틀은 거뜬합니다."),
    (5, "출퇴근용으로 샀는데 대만족입니다. 통화 품질도 깔끔하고 블루투스 연결이 빠르네요."),
    (4, "음질은 훌륭한데 장시간 착용하면 귀 윗부분이 조금 눌려요. 2시간 정도 쓰면 잠깐 벗게 됩니다."),
    (5, "저음이 풍부하고 해상도가 좋아요. 앱에서 EQ 조절되는 것도 편합니다."),
    (3, "기능은 좋은데 무게가 좀 있어서 목에 걸고 다니기 불편해요. 케이스가 커서 가방 공간을 많이 차지합니다."),
    (4, "가격 대비 노캔 성능은 최고 수준. 다만 바람 부는 날엔 바람 소리가 약간 들어와요."),
    (5, "선물용으로 구매했는데 포장도 고급스럽고 받는 사람이 아주 좋아했어요."),
    (2, "한쪽 이어컵에서 미세한 잡음이 있어 교환 신청했습니다. 교환 처리는 빨랐어요."),
    (5, "재택근무 화상회의 때 마이크가 목소리를 또렷하게 잡아줘요. 주변 소음 차단도 좋습니다."),
    (4, "착용감은 무난하고 터치 조작이 직관적이에요. 충전이 USB-C라 편합니다."),
]

GENERIC_REVIEWS = {
    "sports": [(5, "쿠션감이 좋아서 오래 달려도 발이 덜 아파요."), (4, "사이즈는 정사이즈로 맞고 가벼워요. 색감도 사진과 같아요."),
               (5, "홈트용으로 매일 쓰는데 미끄러지지 않아서 좋습니다."), (3, "디자인은 좋은데 발볼이 좁은 편이에요. 반 치수 크게 추천합니다.")],
    "fashion": [(5, "핏이 예쁘고 마감이 깔끔해요. 데일리로 잘 입고 있어요."), (4, "생각보다 두께감이 있어서 좋아요. 배송도 빨랐습니다."),
                (5, "사진보다 실물이 더 고급스러워요. 재구매 의사 있습니다."), (3, "색은 마음에 드는데 사이즈가 살짝 크게 나왔어요.")],
    "electronics": [(5, "연결이 안정적이고 배터리가 오래가요."), (4, "가성비 좋은 제품입니다. 설정도 간단해요."),
                    (4, "디자인 깔끔하고 기능 충실합니다. 설명서가 조금 부실한 게 아쉬워요.")],
    "beauty": [(5, "향이 은은하게 오래 남아요. 선물했더니 반응이 좋았어요."), (4, "건성인데 촉촉함이 오래가요. 끈적임도 없어요."),
               (5, "패키지가 예뻐서 선물용으로 딱이에요.")],
    "living": [(5, "인테리어 소품으로 분위기가 확 살아요."), (4, "마감 깔끔하고 사진과 동일합니다."), (5, "선물 포장이 정성스러워서 만족해요.")],
    "food": [(5, "산미와 단맛 밸런스가 좋아요. 로스팅 날짜가 최근이라 신선합니다."), (4, "선물용으로 구매했는데 구성이 알차요.")],
    "toys": [(5, "아이도 좋아하고 장식용으로도 예뻐요.")],
}

# 데모 구매자의 6개월 구매 이력 (개인화 추천 시연용: 운동·러닝 취향)
DEMO_ORDERS = [
    (165, ["에어 플로우 러닝화 (레드)"]),
    (142, ["논슬립 요가매트 8mm", "오가닉 코튼 반팔 티셔츠 (화이트)"]),
    (94, ["무선 이어버드 프로"]),
    (54, ["조거 트레이닝 세트 (옐로우)"]),
    (21, ["논슬립 요가매트 8mm"]),
]

NOTICES = [
    ("AI 쇼핑 어시스턴트 정식 오픈 안내", "화면 오른쪽 아래 AI 버튼에서 상품 추천, 규정 문의, 일반 상담을 받을 수 있습니다. 로그인하면 구매 이력을 바탕으로 맞춤 추천을 제공합니다.", True),
    ("이미지로 상품 찾기 기능 추가", "검색창의 카메라 아이콘을 눌러 사진을 올리면 비슷한 상품을 찾아드립니다.", False),
    ("가을 시즌 러닝 기획전 (~10/31)", "러닝화·트레이닝복 최대 30% 할인. 기획전 상품은 3만원 이상 무료배송됩니다.", False),
    ("개인정보처리방침 개정 안내", "회원 탈퇴 시 거래 기록 보관 기간 등 관련 조항이 정비되었습니다.", False),
]

FAQS = [
    ("배송", "배송은 얼마나 걸리나요?", "결제 완료 후 평균 1~3영업일 이내 출고되며, 제주·도서산간은 1~2일 더 소요될 수 있습니다."),
    ("교환/반품", "단순 변심으로 반품할 수 있나요?", "상품 수령 후 7일 이내 미사용 상태라면 가능합니다. 왕복 배송비 6,000원이 부과됩니다."),
    ("포인트", "포인트는 언제 적립되나요?", "구매확정 시 결제 금액의 1%가 적립되며, 유효기간은 적립일로부터 1년입니다."),
    ("AI 기능", "AI 추천은 어떻게 동작하나요?", "질문 의도와 최근 구매 이력을 분석해 상품 후보를 고르고, AI가 근거와 함께 설명합니다."),
]


# ------------------------------------------------------------------ RAG 문서
POLICIES = {
    "배송_정책.pdf": ("배송 정책", [
        "모든 상품은 결제 완료 후 1~3영업일 이내에 출고됩니다. 주문 제작 상품과 예약 판매 상품은 상품 상세 페이지에 안내된 출고일을 따릅니다. 평일 오후 2시 이전 결제 건은 당일 출고를 원칙으로 하며, 토요일·일요일·공휴일에는 출고하지 않습니다.",
        "기본 배송비는 3,000원이며, 한 판매자 기준 결제 금액이 30,000원 이상이면 무료로 배송됩니다. 제주 지역은 3,000원, 도서산간 지역은 5,000원의 추가 배송비가 부과되며 배송 기간이 1~2일 더 소요될 수 있습니다.",
        "출고 후 운송장 번호는 마이페이지 주문내역과 알림으로 안내됩니다. 배송 조회가 48시간 이상 갱신되지 않으면 고객센터 1:1 문의 또는 상담사 연결로 접수해 주시면 택배사에 확인 후 안내해 드립니다. 배송 완료 후 7일이 지나면 자동으로 구매확정 처리됩니다.",
        "여러 판매자의 상품을 함께 주문하면 판매자별로 따로 포장되어 각각 출고되며, 배송비도 판매자별로 계산됩니다. 일부 상품이 품절되면 남은 상품을 먼저 보내는 부분 배송이 진행되고, 품절 상품의 결제 금액은 자동으로 취소됩니다.",
        "배송지 변경은 상품 준비중 단계까지 마이페이지에서 직접 할 수 있습니다. 출고 이후에는 택배사로 직접 변경을 요청해야 하며, 이 경우 택배사 정책에 따라 추가 비용이 발생할 수 있습니다. 해외 배송과 군부대·사서함 배송은 지원하지 않습니다.",
        "신선식품과 원두 등 식품류는 주문 후 로스팅·포장을 거쳐 출고되므로 일반 상품보다 1일 늦게 출고될 수 있습니다. 대형 가구는 설치 기사 방문 일정에 맞춰 개별 연락 후 배송되며, 엘리베이터가 없는 3층 이상은 계단 운반비가 추가될 수 있습니다.",
    ]),
    "교환_반품_환불_규정.pdf": ("교환·반품·환불 규정", [
        "상품 수령일로부터 7일 이내에는 단순 변심에 의한 교환 및 반품을 신청할 수 있습니다. 단, 상품을 사용했거나 택·포장을 훼손한 경우, 시간이 지나 재판매가 어려울 정도로 가치가 떨어진 경우에는 교환과 반품이 제한됩니다.",
        "단순 변심으로 반품하는 경우 왕복 배송비 6,000원은 고객이 부담하며, 교환 시에도 동일한 왕복 배송비가 부과됩니다. 상품 불량, 오배송, 표시·광고 내용과 다른 상품을 받은 경우에는 수령 후 30일 이내 신청할 수 있고 배송비는 판매자가 부담합니다.",
        "환불은 반품 상품이 판매자 물류센터에 도착해 검수가 끝난 날로부터 3영업일 이내에 처리됩니다. 신용카드 결제는 카드사 승인 취소로 환불되며 카드사 사정에 따라 3~7일이 걸릴 수 있습니다. 계좌이체 결제는 마이페이지에 등록한 환불 계좌로 입금되며, 사용한 포인트와 쿠폰은 환불 시 함께 복원됩니다.",
        "다음 상품은 단순 변심에 의한 교환·반품이 불가합니다. 개봉한 화장품과 향수, 위생상 재판매가 어려운 속옷·양말·이어폰 팁, 고객 요청으로 각인이나 주문 제작을 한 상품, 개봉한 식품, 디지털 기기의 박스 봉인 씰을 제거한 경우가 해당합니다.",
        "반품 신청은 마이페이지 주문내역에서 사유를 선택하고 사진을 첨부해 접수합니다. 접수 후 2영업일 이내 택배 기사가 방문 회수하며, 고객이 직접 다른 택배로 보낸 경우 발생한 추가 비용은 환불되지 않습니다. 교환은 같은 상품의 옵션 변경만 가능하고, 다른 상품으로 바꾸려면 반품 후 새로 주문해야 합니다.",
    ]),
    "포인트_쿠폰_이용약관.pdf": ("포인트·쿠폰 이용약관", [
        "포인트는 구매확정 시 실제 결제 금액의 1%가 적립되며, 텍스트 리뷰 작성 시 300포인트, 사진 리뷰 작성 시 500포인트가 추가로 지급됩니다. 신규 회원가입 시 5,000포인트가 지급됩니다. 적립된 포인트의 유효기간은 적립일로부터 1년이며 기간이 지나면 자동으로 소멸됩니다.",
        "포인트는 1,000포인트 이상 보유 시 1포인트 단위로 사용할 수 있고, 한 번 주문에 상품 금액의 최대 50%까지 사용할 수 있습니다. 배송비 결제에는 포인트를 사용할 수 없습니다.",
        "쿠폰은 주문 1건당 1장만 사용할 수 있으며 포인트와 함께 사용할 수 있습니다. 쿠폰별 최소 주문 금액과 최대 할인 금액이 다르므로 쿠폰함에서 조건을 확인해 주세요. 주문을 취소하거나 반품하면 유효기간이 남은 쿠폰은 다시 사용할 수 있도록 복원됩니다.",
        "멤버십 플러스 회원은 구매확정 시 기본 1%에 2%가 더해져 총 3%가 적립되고, 매월 무료배송 쿠폰 4장이 발급됩니다. 멤버십 라이트 회원은 매월 무료배송 쿠폰 2장이 발급됩니다. 멤버십을 해지하면 다음 결제일부터 혜택이 중단되며 이미 적립된 포인트는 유지됩니다.",
        "소멸 예정 포인트는 소멸 30일 전에 알림과 이메일로 안내됩니다. 포인트는 현금으로 환급되지 않으며 다른 회원에게 양도할 수 없습니다. 부정한 방법으로 적립한 포인트는 사전 통보 없이 회수될 수 있습니다.",
    ]),
}


def make_policy_pdfs():
    """정책 문서를 HTML → PDF 로 만듭니다 (원본 '회원가입 및 계정관리 규정' 과 같은 형식)."""
    from playwright.sync_api import sync_playwright
    out = ASSETS / "policies"
    out.mkdir(parents=True, exist_ok=True)
    original = ROOT / "backend" / "uploaded_pdfs" / "830e28d6-e967-4885-b21c-0f8371282bb0.pdf"
    target = out / "회원가입_및_계정관리_규정.pdf"
    if original.exists() and not target.exists():
        target.write_bytes(original.read_bytes())
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for fname, (title, paras) in POLICIES.items():
            if (out / fname).exists():
                continue
            body = "".join(f"<p>{x}</p>" for x in paras)
            page.set_content(f"""<html><head><meta charset="utf-8"><style>
              body{{font-family:'Malgun Gothic',sans-serif;font-size:12pt;line-height:1.8;margin:28mm 24mm;color:#111}}
              h1{{font-size:18pt;margin:0 0 10mm}} p{{margin:0 0 5mm}}</style></head>
              <body><h1>{title}</h1>{body}</body></html>""")
            page.pdf(path=str(out / fname), format="A4")
        browser.close()
    return sorted(out.glob("*.pdf"))


# ------------------------------------------------------------------ 실행
def main():
    pg = CFG["pg"]
    conn = psycopg2.connect(host=pg["host"], port=pg["port"], user=pg["user"], password=pg["password"], dbname=pg["db"])
    conn.autocommit = True
    cur = conn.cursor()

    def add_auth_user(email, password):
        uid = uuid.uuid4()
        cur.execute("insert into auth.users (id, email, encrypted_password) values (%s,%s,%s)",
                    (uid, email, bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()))
        return uid

    def add_profile(uid, email, name, user_type="buyer", created=None):
        cur.execute("""insert into profiles (id, email, full_name, name, phone, user_type, point_balance, created_at, updated_at)
                       values (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (uid, email, name, name, f"010-0000-{random.randint(1000, 9999)}", user_type, 5000,
                     created or NOW - timedelta(days=300), NOW))

    # 관리자
    cur.execute("""insert into admin_users (email, password_hash, full_name, role) values (%s,%s,%s,'super_admin') returning id""",
                ("admin@example.com", bcrypt.hashpw(b"admin1234!", bcrypt.gensalt()).decode(), "운영관리자"))
    admin_id = cur.fetchone()[0]
    cur.execute("""insert into crm_system_settings (admin_email, admin_phone, business_number, business_name, ceo_name, business_address)
                   values ('admin@example.com','02-0000-0000','000-00-00000','AI 쇼핑몰','운영관리자','서울특별시 (데모)')""")

    # 데모 구매자 + 리뷰어
    demo_id = add_auth_user("demo@example.com", "demo1234!")
    add_profile(demo_id, "demo@example.com", "이하늘", created=NOW - timedelta(days=210))
    reviewer_ids = []
    for i, name in enumerate(REVIEWERS):
        email = f"buyer{i + 1}@example.com"
        uid = add_auth_user(email, "buyer1234!")
        add_profile(uid, email, name)
        reviewer_ids.append(uid)

    # 판매자
    vendor_ids = {}
    for key, (store, desc, email, owner) in VENDORS.items():
        uid = add_auth_user(email, "seller1234!")
        add_profile(uid, email, owner, user_type="seller")
        cur.execute("""insert into vendors (user_id, business_name, business_number, business_address, owner_name, ceo_name,
                       phone, email, store_name, store_description, approval_status, approved_at, rating, review_count)
                       values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'approved',%s,4.6,0) returning id""",
                    (uid, f"{store} (데모)", f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(10000,99999)}",
                     "서울특별시 (데모 주소)", owner, owner, "02-000-0000", email, store, desc, NOW - timedelta(days=280)))
        vendor_ids[key] = cur.fetchone()[0]

    # 카테고리
    cat_ids = {}
    for i, (name, slug) in enumerate(CATEGORIES):
        cur.execute("insert into categories (name, slug, sort_order) values (%s,%s,%s) returning id", (name, slug, i))
        cat_ids[slug] = cur.fetchone()[0]

    # 상품 (+ CLIP 이미지 임베딩)
    sys.path.insert(0, str(ROOT / "backend"))
    from app.services.image_embedding import get_image_embedding_service
    clip = get_image_embedding_service()
    prod = {}
    deals = {"노이즈캔슬링 무선 헤드폰": 0.22, "울 블렌드 벨티드 코트": 0.3, "우드윅 소이 캔들": 0.25, "쿠션 에어 러닝화 (화이트)": 0.2}
    for idx, (pid, name, cat, vendor, price, tags, desc, target) in enumerate(PRODUCTS):
        url = unsplash(pid)
        emb = clip.generate_embedding(str(download(pid)))  # 앱과 같은 CLIP 경로 (로컬 파일 입력)
        created = NOW - timedelta(days=240 - idx * 5, hours=random.randint(0, 20))
        d = deals.get(name)
        cur.execute("""insert into products (vendor_id, category_id, name, slug, description, meta_description, price,
                       discount_price, discount_start, discount_end, stock, stock_quantity, thumbnail_url, images, tags,
                       image_embedding, is_featured, created_at, updated_at)
                       values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) returning id""",
                    (vendor_ids[vendor], cat_ids[cat], name, f"p-{idx + 1:03d}", desc, desc, price,
                     round(price * (1 - d), -2) if d else None, NOW - timedelta(days=1) if d else None,
                     NOW + timedelta(days=2) if d else None, 120, 120, url, [url], tags, emb, idx < 8, created, created))
        prod[name] = {"id": cur.fetchone()[0], "price": price, "vendor": vendor_ids[vendor], "cat": cat, "target": target}
        print(f"  상품 {idx + 1:02d}/{len(PRODUCTS)} {name} (CLIP {len(emb)}d)")

    # 주문: 리뷰어들의 구매 (판매량·베스트 상품 집계용)
    def add_order(buyer, days_ago, items, status="delivered"):
        created = NOW - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        total = sum(prod[n]["price"] * q for n, q in items)
        cur.execute("""insert into orders (buyer_id, order_number, status, subtotal, total, total_amount, final_amount,
                       payment_method, payment_status, recipient_name, shipping_address, paid_at, created_at, updated_at)
                       values (%s,%s,%s,%s,%s,%s,%s,'card','paid','데모','서울특별시 (데모)',%s,%s,%s) returning id""",
                    (buyer, f"ORD-{created:%Y%m%d}-{random.randint(1000, 9999)}", status, total, total, total, total,
                     created, created, created))
        oid = cur.fetchone()[0]
        out = []
        for n, q in items:
            p = prod[n]
            cur.execute("""insert into order_items (order_id, product_id, vendor_id, product_name, quantity, price, subtotal,
                           total_price, status, created_at) values (%s,%s,%s,%s,%s,%s,%s,%s,'delivered',%s) returning id""",
                        (oid, p["id"], p["vendor"], n, q, p["price"], p["price"] * q, p["price"] * q, created))
            out.append(cur.fetchone()[0])
        return oid, out, created

    reviews = []
    for name, p in prod.items():
        pool = HEADPHONE_REVIEWS if name == "노이즈캔슬링 무선 헤드폰" else \
            random.sample(GENERIC_REVIEWS[p["cat"]], k=min(len(GENERIC_REVIEWS[p["cat"]]), random.randint(1, 3)))
        sold = 0
        for i, (rating, text) in enumerate(pool):
            buyer = reviewer_ids[i % len(reviewer_ids)]
            oid, items, created = add_order(buyer, random.randint(8, 170), [(name, 1)])
            reviews.append((buyer, p["id"], p["vendor"], oid, items[0], rating, text, created + timedelta(days=4)))
            sold += 1
        while sold < p["target"]:
            q = random.choice([1, 1, 1, 2])
            add_order(random.choice(reviewer_ids), random.randint(3, 180), [(name, q)])
            sold += q
        cur.execute("update products set sale_count = %s where id = %s", (sold, p["id"]))

    cur.execute("update products p set category = c.name from categories c where c.id = p.category_id")

    # 데모 구매자 이력
    for days, names in DEMO_ORDERS:
        add_order(demo_id, days, [(n, 1) for n in names])

    for r in reviews:
        cur.execute("""insert into reviews (user_id, product_id, vendor_id, order_id, order_item_id, rating, content, created_at)
                       values (%s,%s,%s,%s,%s,%s,%s,%s)""", r)
    cur.execute("""update products p set rating = s.avg, review_count = s.cnt
                   from (select product_id, round(avg(rating)::numeric, 1) avg, count(*) cnt from reviews group by product_id) s
                   where s.product_id = p.id""")
    cur.execute("""update vendors v set review_count = s.cnt from
                   (select vendor_id, count(*) cnt from reviews group by vendor_id) s where s.vendor_id = v.id""")

    # 공지 · FAQ · 알림
    for i, (title, content, important) in enumerate(NOTICES):
        cur.execute("insert into notices (author_id, title, content, is_important, is_pinned, views, created_at) values (%s,%s,%s,%s,%s,%s,%s)",
                    (admin_id, title, content, important, important, random.randint(40, 400), NOW - timedelta(days=3 + i * 9)))
    for i, (cat, q, a) in enumerate(FAQS):
        cur.execute("insert into faqs (author_id, category, question, answer, sort_order, views, created_at) values (%s,%s,%s,%s,%s,%s,%s)",
                    (admin_id, cat, q, a, i, random.randint(30, 300), NOW - timedelta(days=20 + i)))
    cur.execute("""insert into notifications (user_id, type, title, body, summary, is_read) values
                   (%s,'order','주문하신 상품이 배송 완료되었습니다','논슬립 요가매트 8mm 배송이 완료되었습니다.','배송 완료',false)""", (demo_id,))
    cur.execute("""insert into subscription_plans (name, slug, description, price, duration_days, is_buyer) values
                   ('멤버십 라이트','lite','무료배송 쿠폰 월 2장',2900,30,true), ('멤버십 플러스','plus','무료배송 + 추가 적립 2%',4900,30,true)""")
    conn.close()
    print("[seed] DB 데이터 입력 완료")

    # 이미지 검색 질의용 사진
    qdir = ASSETS / "query"
    qdir.mkdir(parents=True, exist_ok=True)
    for fname, pid in QUERY_IMAGES.items():
        (qdir / fname).write_bytes(download(pid, 900).read_bytes())

    upload_documents()
    print("[seed] 완료")


def upload_documents():
    """RAG 문서 업로드 — 실제 백엔드 파이프라인(POST /documents/upload) 사용. 기존 문서는 지우고 다시 올립니다."""
    for doc in requests.get(f"{BACKEND}/documents", timeout=30).json().get("documents", []):
        requests.delete(f"{BACKEND}/documents/{doc['id']}", timeout=30)
    for pdf in make_policy_pdfs():
        with open(pdf, "rb") as f:
            r = requests.post(f"{BACKEND}/documents/upload", files={"file": (pdf.name, f, "application/pdf")}, timeout=600)
        print(f"  RAG 업로드 {pdf.name}: {r.status_code} 청크 {r.json().get('chunk_count', r.text[:120])}")


if __name__ == "__main__":
    if "--docs-only" in sys.argv:
        upload_documents()
    else:
        main()
