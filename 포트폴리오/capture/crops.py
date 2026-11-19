"""
화면 캡처(shots/*.png)를 슬라이드용으로 다듬어 shots/clean/*.png 로 저장합니다.

- crop   : CSS 좌표 (캡처는 2배 해상도) [x, y, w, h]
- flat   : 페이지 바탕색(연회색)을 흰색으로 — 테두리에 닿은 바탕 영역만 칠해 내용은 건드리지 않음
- ratio  : 가로/세로 비율을 맞추려고 흰 여백을 덧붙임 (갤러리 타일 크기 통일)

  python capture/crops.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
SHOTS = HERE.parent / "shots"
OUT = SHOTS / "clean"
OUT.mkdir(exist_ok=True)
S = 2  # 캡처 배율

TILE = 1.75  # 갤러리 타일 비율

SPECS = {
    # 갤러리 (01쪽)
    "t-rag": ("hero", [940, 112, 472, 240], {"ratio": TILE}),
    "t-search": ("image-search-full", [150, 650, 850, 447], {"ratio": TILE}),
    "t-gift": ("gift-result-full", [176, 465, 1088, 600], {"ratio": TILE}),
    "t-shop": ("widget-shop-end", [16, 76, 448, 412], {"ratio": TILE}),
    "t-modes": ("agent-modes", [20, 145, 440, 480], {"ratio": TILE}),
    "t-review": ("review-narrow", [17, 58, 500, 242], {"ratio": TILE}),
    # 본문
    "rag-crm": ("crm-documents", [362, 432, 976, 252], {}),
    "rag-chat": ("hero", [940, 112, 472, 240], {}),
    "shop-widget": ("widget-shop-end", [0, 0, 480, 492], {}),
    "personal-widget": ("widget-personal", [0, 0, 480, 700], {}),
    "gift-step": ("gift-step1", [222, 110, 1018, 470], {"flat": True}),
    "gift-result": ("gift-result-full", [176, 465, 1088, 600], {}),
    # RAG 에이전트
    "cover-hero": ("agent-hero", [600, 70, 840, 770], {}),
    "agent-multi": ("agent-multi", [0, 0, 480, 572], {}),
    "agent-order": ("agent-order", [0, 0, 480, 470], {}),
    "agent-modes": ("agent-modes", [20, 180, 440, 330], {}),
}


def flatten(im: Image.Image) -> Image.Image:
    """테두리에서 이어진 '거의 흰 회색' 바탕을 순백으로."""
    im = im.copy()
    w, h = im.size
    seeds = [(x, y) for x in (0, w // 4, w // 2, 3 * w // 4, w - 1) for y in (0, h - 1)] + \
            [(x, y) for y in (h // 4, h // 2, 3 * h // 4) for x in (0, w - 1)]
    for s in seeds:
        r, g, b = im.getpixel(s)[:3]
        if 240 <= min(r, g, b) < 255 and max(r, g, b) - min(r, g, b) <= 4:
            ImageDraw.floodfill(im, s, (255, 255, 255), thresh=3)
    return im


def pad(im: Image.Image, ratio: float) -> Image.Image:
    w, h = im.size
    if abs(w / h - ratio) < 0.01:
        return im
    if w / h > ratio:
        nw, nh = w, round(w / ratio)
    else:
        nw, nh = round(h * ratio), h
    out = Image.new("RGB", (nw, nh), (255, 255, 255))
    out.paste(im, ((nw - w) // 2, (nh - h) // 2))
    return out


def main():
    for name, (src, (x, y, w, h), opt) in SPECS.items():
        im = Image.open(SHOTS / f"{src}.png").convert("RGB").crop((x * S, y * S, (x + w) * S, (y + h) * S))
        if opt.get("flat"):
            im = flatten(im)
        if opt.get("ratio"):
            im = pad(im, opt["ratio"])
        im.save(OUT / f"{name}.png")
        print(f"  {name:<16} ← {src} {im.size[0] // S}×{im.size[1] // S}")


if __name__ == "__main__":
    main()
