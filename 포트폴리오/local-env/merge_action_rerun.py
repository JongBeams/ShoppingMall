"""
실행 평가 결과 정리 — 인프라 오류 행 교체 + 고친 채점 규칙으로 재채점

  python merge_action_rerun.py <다시 돌린 결과.json>

- 서비스 재기동 중 연결 오류로 끝난 행(cat == "오류" 또는 errors 있음)만 지우고, 같은 시나리오를 다시 돌린 결과로 채움
- "배송중 주문 취소" 채점 정규식을 넓힌 것(조사 차이 "취소가/취소는 불가")을 저장된 답변에 같은 기준으로 다시 적용
- 교체 내역은 결과 파일의 merged_rerun 에 남김
"""
import json
import re
import sys
from pathlib import Path

from action_eval import REFUSE  # 평가 스크립트와 같은 채점 규칙

OUT = Path(__file__).resolve().parent.parent / "data" / "action_metrics.json"


def summarize(rows):
    by, cats = {}, {}
    for r in rows:
        k = (r["cat"], r["name"])
        v = by.setdefault(k, [0, 0])
        v[0] += r["ok"]
        v[1] += 1
    for (c, _), (ok, n) in by.items():
        x = cats.setdefault(c, [0, 0])
        x[0] += ok
        x[1] += n
    return ([{"cat": c, "name": n, "ok": v[0], "n": v[1]} for (c, n), v in by.items()],
            {c: f"{v[0]}/{v[1]}" for c, v in cats.items()})


def main():
    main_ = json.loads(OUT.read_text(encoding="utf-8"))
    rerun = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")) if len(sys.argv) > 1 else {"rows": []}
    bad = [r for r in main_["rows"] if r["cat"] == "오류" or r.get("errors")]
    rows = [r for r in main_["rows"] if not (r["cat"] == "오류" or r.get("errors"))]
    rows += [r for r in rerun["rows"] if not (r["cat"] == "오류" or r.get("errors"))]
    rescored = 0
    for r in rows:  # 채점 규칙 수정분 재적용
        if r["name"] == "배송중 주문 취소 요청 → 이유와 대안 안내" and not r["ok"]:
            ans = r.get("answer", "")
            if not r.get("confirm") and re.search(r"배송", ans) and re.search(REFUSE, ans):
                r["ok"], rescored = True, rescored + 1
    main_["rows"] = rows
    main_["by_scenario"], main_["by_cat"] = summarize(rows)
    main_["unconfirmed_actions"] = main_.get("unconfirmed_actions", 0) + rerun.get("unconfirmed_actions", 0)
    main_["merged_rerun"] = {"replaced_error_rows": len(bad), "from": Path(sys.argv[1]).name if len(sys.argv) > 1 else None,
                             "rescored_refusal": rescored,
                             "reason": "평가 중 로컬 서비스 재기동으로 생긴 연결 오류 행만 같은 시나리오 재실행 결과로 교체"}
    OUT.write_text(json.dumps(main_, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: main_[k] for k in ("by_cat", "unconfirmed_actions", "merged_rerun")}, ensure_ascii=False))
    for s in main_["by_scenario"]:
        print(f"  {s['cat']} · {s['name']}: {s['ok']}/{s['n']}")


if __name__ == "__main__":
    main()
