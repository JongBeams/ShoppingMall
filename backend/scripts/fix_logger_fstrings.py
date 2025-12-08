#!/usr/bin/env python3
"""
logger 호출에서 누락된 f-string 접두사 추가

logger.error({...} 형태를 logger.error(f"{...}") 형태로 수정
"""
import re
from pathlib import Path

BACKEND_DIR = Path(__file__).parent.parent
APP_DIR = BACKEND_DIR / "app"


def fix_logger_fstring(content: str) -> str:
    """logger 호출에서 누락된 f 추가"""

    # 패턴: logger.xxx(중괄호가 있는 문자열")
    # logger.error({...}") → logger.error(f"{...}")
    pattern = r'(logger\.(debug|info|warning|error))\(([^f"\'])(.*?)\{(.*?)\}(.*?)"\)'

    def replacer(match):
        logger_call = match.group(1)  # logger.error
        first_char = match.group(3)  # f가 아닌 첫 문자
        before_brace = match.group(4)  # { 앞 부분
        inside_brace = match.group(5)  # {} 안 부분
        after_brace = match.group(6)  # } 뒤 부분

        # f-string으로 변환
        return f'{logger_call}(f"{first_char}{before_brace}{{{inside_brace}}}{after_brace}")'

    # 변환 적용
    fixed = re.sub(pattern, replacer, content)

    return fixed


def process_file(file_path: Path) -> None:
    """파일 처리"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 변환
        fixed = fix_logger_fstring(content)

        if fixed != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"Fixed: {file_path.relative_to(BACKEND_DIR)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")


def main():
    """메인 함수"""
    print("=" * 60)
    print("logger f-string 누락 수정 시작")
    print("=" * 60)
    print()

    python_files = list(APP_DIR.rglob("*.py"))

    for file_path in python_files:
        process_file(file_path)

    print()
    print("=" * 60)
    print("수정 완료!")
    print("=" * 60)


if __name__ == "__main__":
    main()
