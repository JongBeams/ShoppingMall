"""
백엔드 의존성 자동 설치 스크립트
누락된 패키지가 있으면 자동으로 설치합니다.
"""

import subprocess
import sys
import pkg_resources

def install_requirements():
    """requirements.txt의 모든 패키지를 확인하고 누락된 것을 설치"""
    requirements_file = "requirements.txt"

    print("=" * 60)
    print("백엔드 의존성 확인 중...")
    print("=" * 60)

    try:
        with open(requirements_file, 'r', encoding='utf-8') as f:
            requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    except FileNotFoundError:
        print(f"❌ {requirements_file} 파일을 찾을 수 없습니다.")
        sys.exit(1)

    missing_packages = []

    # 설치된 패키지 목록 가져오기
    installed_packages = {pkg.key for pkg in pkg_resources.working_set}

    for requirement in requirements:
        # 패키지 이름 추출 (버전 정보 제거)
        package_name = requirement.split('[')[0].split('==')[0].split('>=')[0].split('<')[0].strip()

        if package_name.lower() not in installed_packages:
            missing_packages.append(requirement)
            print(f"⚠️  누락: {requirement}")
        else:
            print(f" 설치됨: {package_name}")

    if missing_packages:
        print("\n" + "=" * 60)
        print(f"누락된 패키지 {len(missing_packages)}개를 설치합니다...")
        print("=" * 60)

        for package in missing_packages:
            print(f"\n📦 설치 중: {package}")
            try:
                subprocess.check_call([
                    sys.executable,
                    "-m",
                    "pip",
                    "install",
                    package,
                    "--user"
                ])
                print(f" 설치 완료: {package}")
            except subprocess.CalledProcessError as e:
                print(f"❌ 설치 실패: {package}")
                print(f"   에러: {e}")
                sys.exit(1)

        print("\n" + "=" * 60)
        print(" 모든 의존성 설치 완료!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print(" 모든 의존성이 이미 설치되어 있습니다.")
        print("=" * 60)

if __name__ == "__main__":
    install_requirements()
