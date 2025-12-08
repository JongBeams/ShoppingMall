#!/usr/bin/env python3
"""
print() 를 logger로 일괄 변경하는 스크립트

사용법:
    python scripts/replace_print_with_logger.py
"""
import os
import re
from pathlib import Path

# 백엔드 디렉토리
BACKEND_DIR = Path(__file__).parent.parent
APP_DIR = BACKEND_DIR / "app"


def has_logging_import(content: str) -> bool:
    """파일에 logging import가 있는지 확인"""
    return bool(re.search(r'^import logging', content, re.MULTILINE) or
                re.search(r'^from logging import', content, re.MULTILINE))


def has_logger_instance(content: str) -> bool:
    """파일에 logger 인스턴스가 있는지 확인"""
    return bool(re.search(r'logger\s*=\s*logging\.getLogger', content))


def add_logging_setup(content: str) -> str:
    """파일 상단에 logging 설정 추가"""
    lines = content.split('\n')

    # import 구간 찾기
    import_end_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('import ') or line.startswith('from '):
            import_end_idx = i + 1
        elif import_end_idx > 0 and not line.strip():
            # 빈 줄을 만나면 import 구간 종료
            break

    # logging import 추가
    if not has_logging_import(content):
        lines.insert(import_end_idx, 'import logging')
        import_end_idx += 1

    # logger 인스턴스 추가
    if not has_logger_instance(content):
        # import 끝나고 빈 줄 추가 후 logger 선언
        while import_end_idx < len(lines) and not lines[import_end_idx].strip():
            import_end_idx += 1

        lines.insert(import_end_idx, '')
        lines.insert(import_end_idx + 1, 'logger = logging.getLogger(__name__)')
        lines.insert(import_end_idx + 2, '')

    return '\n'.join(lines)


def replace_print_statements(content: str) -> str:
    """print 문을 logger로 변경"""

    # 패턴 1: print(f"[ERROR] ...") -> logger.error("...")
    content = re.sub(
        r'print\(f?"?\[ERROR\]\s*([^"\']*(?:["\'][^"\']*["\'][^"\']*)*)["\']?\)',
        r'logger.error(\1)',
        content
    )

    # 패턴 2: print(f"[WARNING] ...") -> logger.warning("...")
    content = re.sub(
        r'print\(f?"?\[WARNING\]\s*([^"\']*(?:["\'][^"\']*["\'][^"\']*)*)["\']?\)',
        r'logger.warning(\1)',
        content
    )

    # 패턴 3: print(f"[INFO] ...") -> logger.info("...")
    content = re.sub(
        r'print\(f?"?\[INFO\]\s*([^"\']*(?:["\'][^"\']*["\'][^"\']*)*)["\']?\)',
        r'logger.info(\1)',
        content
    )

    # 패턴 4: print(f"[DEBUG] ...") -> logger.debug("...")
    content = re.sub(
        r'print\(f?"?\[DEBUG\]\s*([^"\']*(?:["\'][^"\']*["\'][^"\']*)*)["\']?\)',
        r'logger.debug(\1)',
        content
    )

    # 패턴 5: 일반 print -> logger.info
    # f-string인 경우
    content = re.sub(
        r'print\(f"([^"]*)"\)',
        r'logger.info(f"\1")',
        content
    )

    # 일반 string인 경우
    content = re.sub(
        r'print\("([^"]*)"\)',
        r'logger.info("\1")',
        content
    )

    return content


def process_file(file_path: Path) -> None:
    """단일 Python 파일 처리"""
    print(f"Processing: {file_path.relative_to(BACKEND_DIR)}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # print 문이 없으면 스킵
    if 'print(' not in content:
        print(f"  -> Skipped (no print statements)")
        return

    original_content = content

    # logging 설정 추가
    content = add_logging_setup(content)

    # print를 logger로 변경
    content = replace_print_statements(content)

    # 변경사항이 있으면 파일 저장
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  -> Updated ✓")
    else:
        print(f"  -> No changes")


def main():
    """메인 함수"""
    print("=" * 60)
    print("print() -> logger 일괄 변환 시작")
    print("=" * 60)
    print()

    # app 디렉토리의 모든 Python 파일 찾기
    python_files = list(APP_DIR.rglob("*.py"))

    print(f"총 {len(python_files)}개 파일 발견\n")

    for file_path in python_files:
        try:
            process_file(file_path)
        except Exception as e:
            print(f"  -> Error: {e}")

    print()
    print("=" * 60)
    print("변환 완료!")
    print("=" * 60)


if __name__ == "__main__":
    main()
