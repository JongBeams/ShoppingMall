#!/usr/bin/env python3
import os
import sys
import json
import re
import secrets
import base64

# --- Constants ---
PROGRESS_FILE = ".setup_progress"

# --- ANSI Colors ---
class Colors:
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"

# --- UI Helpers ---
def print_banner():
    print(f"""
{Colors.BLUE}{Colors.BOLD}
    ███████╗██╗  ██╗ ██████╗ ██████╗ ██████╗ ██╗███╗   ██╗ ██████╗     ███╗   ███╗ █████╗ ██╗     ██╗
    ██╔════╝██║  ██║██╔═══██╗██╔══██╗██╔══██╗██║████╗  ██║██╔════╝     ████╗ ████║██╔══██╗██║     ██║
    ███████╗███████║██║   ██║██████╔╝██████╔╝██║██╔██╗ ██║██║  ███╗    ██╔████╔██║███████║██║     ██║
    ╚════██║██╔══██║██║   ██║██╔═══╝ ██╔═══╝ ██║██║╚██╗██║██║   ██║    ██║╚██╔╝██║██╔══██║██║     ██║
    ███████║██║  ██║╚██████╔╝██║     ██║     ██║██║ ╚████║╚██████╔╝    ██║ ╚═╝ ██║██║  ██║███████╗███████╗
    ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝     ╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝

    Setup Wizard
{Colors.ENDC}
""")

def print_step(step_num, total_steps, step_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}Step {step_num}/{total_steps}: {step_name}{Colors.ENDC}")
    print(f"{Colors.CYAN}{'='*50}{Colors.ENDC}\n")

def print_info(message):
    print(f"{Colors.CYAN}ℹ️  {message}{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅  {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌  {message}{Colors.ENDC}")

# --- Validators ---
def validate_url(url, allow_empty=False):
    if allow_empty and not url:
        return True
    pattern = re.compile(
        r"^(?:http|https)://"
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|"
        r"localhost|"
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
        r"(?::\d+)?"
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )
    return bool(pattern.match(url))

def validate_api_key(api_key, allow_empty=False):
    if allow_empty and not api_key:
        return True
    return bool(api_key and len(api_key) >= 10)

def generate_secret_key():
    """Generates a secure base64-encoded secret key."""
    key_bytes = secrets.token_bytes(32)
    return base64.b64encode(key_bytes).decode("utf-8")

# --- Environment File Parsing ---
def parse_env_file(filepath):
    env_vars = {}
    if not os.path.exists(filepath):
        return env_vars

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    env_vars[key] = value
    except Exception as e:
        print_warning(f"Could not parse {filepath}: {e}")

    return env_vars

def mask_sensitive_value(value, show_last=4):
    if not value or len(value) <= show_last:
        return value
    return "*" * (len(value) - show_last) + value[-show_last:]

# --- State Management ---
def save_progress(step, data):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump({"step": step, "data": data}, f)

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except (json.JSONDecodeError, KeyError):
                return {"step": 0, "data": {}}
    return {"step": 0, "data": {}}

# --- Main Setup Class ---
class SetupWizard:
    def __init__(self):
        progress = load_progress()
        self.current_step = progress.get("step", 0)

        # Load existing environment variables
        backend_env = parse_env_file(os.path.join("backend", ".env"))
        frontend_env = parse_env_file(os.path.join("frontend", ".env.local"))

        self.env_vars = {
            "setup_method": None,
            "supabase": {
                "SUPABASE_URL": backend_env.get("SUPABASE_URL", ""),
                "SUPABASE_ANON_KEY": backend_env.get("SUPABASE_ANON_KEY", ""),
                "SUPABASE_SERVICE_ROLE_KEY": backend_env.get("SUPABASE_SERVICE_ROLE_KEY", ""),
            },
            "backend": {
                "SECRET_KEY": backend_env.get("SECRET_KEY", ""),
                "REDIS_HOST": backend_env.get("REDIS_HOST", "redis"),
                "REDIS_PORT": backend_env.get("REDIS_PORT", "6379"),
                "BACKEND_PORT": backend_env.get("BACKEND_PORT", "8000"),
            },
            "smtp": {
                "SMTP_HOST": backend_env.get("SMTP_HOST", "smtp.gmail.com"),
                "SMTP_PORT": backend_env.get("SMTP_PORT", "587"),
                "SMTP_USER": backend_env.get("SMTP_USER", ""),
                "SMTP_PASSWORD": backend_env.get("SMTP_PASSWORD", ""),
                "SMTP_FROM_EMAIL": backend_env.get("SMTP_FROM_EMAIL", ""),
            },
            "payment": {
                "TOSS_SECRET_KEY": backend_env.get("TOSS_SECRET_KEY", ""),
                "TOSS_CLIENT_KEY": frontend_env.get("NEXT_PUBLIC_TOSS_CLIENT_KEY", ""),
            },
            "frontend": {
                "NEXT_PUBLIC_SUPABASE_URL": frontend_env.get("NEXT_PUBLIC_SUPABASE_URL", ""),
                "NEXT_PUBLIC_SUPABASE_ANON_KEY": frontend_env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""),
                "NEXT_PUBLIC_BACKEND_URL": "http://localhost:8000",
                "FRONTEND_PORT": frontend_env.get("FRONTEND_PORT", "3000"),
            },
        }

        # Override with saved progress
        saved_data = progress.get("data", {})
        for key, value in saved_data.items():
            if key in self.env_vars and isinstance(value, dict):
                self.env_vars[key].update(value)
            else:
                self.env_vars[key] = value

        self.total_steps = 7

    def run(self):
        print_banner()
        print("쇼핑몰 프로젝트를 자동으로 설정합니다.\n")

        try:
            self.run_step(1, self.choose_setup_method)
            self.run_step(2, self.collect_supabase_info)
            self.run_step(3, self.collect_smtp_info)
            self.run_step(4, self.collect_payment_info)
            self.run_step(5, self.generate_backend_secrets)
            self.run_step(6, self.configure_env_files)
            # Always run final_instructions (Docker build/start)
            self.final_instructions()

        except KeyboardInterrupt:
            print("\n\n설정이 중단되었습니다. 진행 상황은 저장되었습니다.")
            print("언제든지 다시 실행하여 계속할 수 있습니다.")
            sys.exit(1)
        except Exception as e:
            print_error(f"예기치 않은 오류가 발생했습니다: {e}")
            sys.exit(1)

    def run_step(self, step_number, step_function, *args, **kwargs):
        if self.current_step < step_number:
            step_function(*args, **kwargs)
            self.current_step = step_number
            save_progress(self.current_step, self.env_vars)

    def _get_input(self, prompt, validator, error_message, allow_empty=False, default_value=""):
        while True:
            if default_value:
                if "key" in prompt.lower() or "secret" in prompt.lower():
                    display_default = mask_sensitive_value(default_value)
                else:
                    display_default = default_value
                full_prompt = f"{prompt}[{Colors.GREEN}{display_default}{Colors.ENDC}]: "
            else:
                full_prompt = prompt

            value = input(full_prompt).strip()

            if not value and default_value:
                value = default_value

            if validator(value, allow_empty=allow_empty):
                return value
            print_error(error_message)

    def choose_setup_method(self):
        print_step(1, self.total_steps, "설치 방법 선택")

        if self.env_vars.get("setup_method"):
            print_info(f"'{self.env_vars['setup_method']}' 설치 방법으로 계속합니다.")
            return

        print_info("Docker Compose 또는 수동으로 서비스를 시작할 수 있습니다.")
        print(f"\n{Colors.CYAN}어떻게 설정하시겠습니까?{Colors.ENDC}")
        print(f"{Colors.CYAN}[1] {Colors.GREEN}Docker Compose{Colors.ENDC} {Colors.CYAN}(권장, 모든 서비스 자동 시작){Colors.ENDC}")
        print(f"{Colors.CYAN}[2] {Colors.GREEN}수동{Colors.ENDC} {Colors.CYAN}(의존성 설치 및 서비스 수동 실행){Colors.ENDC}\n")

        while True:
            choice = input("선택하세요 (1 또는 2): ").strip()
            if choice == "1":
                self.env_vars["setup_method"] = "docker"
                break
            elif choice == "2":
                self.env_vars["setup_method"] = "manual"
                break
            else:
                print_error("잘못된 선택입니다. 1 또는 2를 입력하세요.")

        print_success(f"'{self.env_vars['setup_method']}' 설치가 선택되었습니다.")

    def collect_supabase_info(self):
        print_step(2, self.total_steps, "Supabase 정보 수집")

        has_existing = any(self.env_vars["supabase"].values())
        if has_existing:
            print_info("기존 Supabase 설정을 찾았습니다. Enter를 눌러 유지하거나 새 값을 입력하세요.")
        else:
            print_info("Supabase 프로젝트가 필요합니다: https://supabase.com/dashboard/projects")
            print_info("프로젝트 설정 → API에서 필요한 정보를 확인하세요:")
            print_info("  - Project URL")
            print_info("  - anon public key")
            print_info("  - service_role secret key")
            input("준비되면 Enter를 누르세요...")

        self.env_vars["supabase"]["SUPABASE_URL"] = self._get_input(
            "Supabase Project URL을 입력하세요 (예: https://xyz.supabase.co): ",
            validate_url,
            "잘못된 URL 형식입니다.",
            default_value=self.env_vars["supabase"]["SUPABASE_URL"],
        )
        self.env_vars["supabase"]["SUPABASE_ANON_KEY"] = self._get_input(
            "Supabase anon key를 입력하세요: ",
            validate_api_key,
            "유효하지 않은 키입니다.",
            default_value=self.env_vars["supabase"]["SUPABASE_ANON_KEY"],
        )
        self.env_vars["supabase"]["SUPABASE_SERVICE_ROLE_KEY"] = self._get_input(
            "Supabase service role key를 입력하세요: ",
            validate_api_key,
            "유효하지 않은 키입니다.",
            default_value=self.env_vars["supabase"]["SUPABASE_SERVICE_ROLE_KEY"],
        )
        print_success("Supabase 정보가 저장되었습니다.")

    def collect_smtp_info(self):
        print_step(3, self.total_steps, "SMTP 설정 (이메일 발송)")

        has_existing = any(self.env_vars["smtp"].values())
        if has_existing:
            print_info("기존 SMTP 설정을 찾았습니다. Enter를 눌러 유지하거나 새 값을 입력하세요.")
        else:
            print_info("Gmail SMTP를 사용하여 이메일 인증번호를 발송합니다.")
            print_info("Gmail 앱 비밀번호 생성 방법:")
            print_info("  1. Google 계정 관리 → 보안 → 2단계 인증 활성화")
            print_info("  2. 앱 비밀번호 생성 (16자리)")
            input("준비되면 Enter를 누르세요...")

        self.env_vars["smtp"]["SMTP_USER"] = self._get_input(
            "Gmail 주소를 입력하세요: ",
            lambda x, allow_empty=False: "@gmail.com" in x or allow_empty,
            "Gmail 주소 형식이 올바르지 않습니다.",
            default_value=self.env_vars["smtp"]["SMTP_USER"],
        )

        self.env_vars["smtp"]["SMTP_PASSWORD"] = self._get_input(
            "Gmail 앱 비밀번호를 입력하세요 (16자리, 공백 제외): ",
            lambda x, allow_empty=False: len(x.replace(" ", "")) >= 16 or allow_empty,
            "앱 비밀번호는 16자리입니다.",
            default_value=self.env_vars["smtp"]["SMTP_PASSWORD"],
        )

        # FROM 이메일은 SMTP_USER와 동일하게 설정
        self.env_vars["smtp"]["SMTP_FROM_EMAIL"] = self.env_vars["smtp"]["SMTP_USER"]

        print_success("SMTP 정보가 저장되었습니다.")

    def collect_payment_info(self):
        print_step(4, self.total_steps, "토스페이먼츠 설정")

        has_existing = bool(self.env_vars["payment"]["TOSS_SECRET_KEY"])
        if has_existing:
            print_info("기존 토스페이먼츠 설정을 찾았습니다. Enter를 눌러 유지하거나 새 값을 입력하세요.")
        else:
            print_info("토스페이먼츠를 사용하여 결제/구독 기능을 제공합니다.")
            print_info("토스페이먼츠 시크릿 키 발급 방법:")
            print_info("  1. https://developers.tosspayments.com/ 접속")
            print_info("  2. 로그인 → 내 개발 정보 → API 키 발급")
            print_info("  3. 테스트: test_gsk_... / 운영: live_gsk_...")
            print_info("  ※ 테스트 환경에서는 test_gsk_로 시작하는 시크릿 키를 사용하세요.")
            input("준비되면 Enter를 누르세요...")

        self.env_vars["payment"]["TOSS_CLIENT_KEY"] = self._get_input(
            "토스페이먼츠 클라이언트 키를 입력하세요 (test_gck_ 또는 live_gck_): ",
            lambda x, allow_empty=False: (x.startswith("test_gck_") or x.startswith("live_gck_") or x.startswith("test_ck_") or x.startswith("live_ck_")) if x else False,
            "토스페이먼츠 클라이언트 키는 'test_gck_', 'live_gck_', 'test_ck_', 또는 'live_ck_'로 시작해야 합니다.",
            default_value=self.env_vars["payment"]["TOSS_CLIENT_KEY"],
        )

        self.env_vars["payment"]["TOSS_SECRET_KEY"] = self._get_input(
            "토스페이먼츠 시크릿 키를 입력하세요 (test_gsk_ 또는 live_gsk_): ",
            lambda x, allow_empty=False: (x.startswith("test_gsk_") or x.startswith("live_gsk_") or x.startswith("test_sk_") or x.startswith("live_sk_")) if x else False,
            "토스페이먼츠 시크릿 키는 'test_gsk_', 'live_gsk_', 'test_sk_', 또는 'live_sk_'로 시작해야 합니다.",
            default_value=self.env_vars["payment"]["TOSS_SECRET_KEY"],
        )

        print_success("토스페이먼츠 정보가 저장되었습니다.")

    def generate_backend_secrets(self):
        print_step(5, self.total_steps, "백엔드 시크릿 생성")

        if not self.env_vars["backend"]["SECRET_KEY"]:
            print_info("안전한 SECRET_KEY를 생성하는 중...")
            self.env_vars["backend"]["SECRET_KEY"] = generate_secret_key()
            print_success("SECRET_KEY가 생성되었습니다.")
        else:
            print_info("기존 SECRET_KEY를 사용합니다.")

        # Set Redis configuration based on setup method
        if self.env_vars["setup_method"] == "docker":
            self.env_vars["backend"]["REDIS_HOST"] = "redis"
        else:
            self.env_vars["backend"]["REDIS_HOST"] = "localhost"

        print_success("백엔드 설정이 완료되었습니다.")

    def configure_env_files(self):
        print_step(6, self.total_steps, "환경 설정 파일 생성")

        # Backend .env
        backend_env_content = f"""# Backend Environment Configuration
# Generated by setup.py

# Supabase Configuration
SUPABASE_URL={self.env_vars['supabase']['SUPABASE_URL']}
SUPABASE_ANON_KEY={self.env_vars['supabase']['SUPABASE_ANON_KEY']}
SUPABASE_SERVICE_ROLE_KEY={self.env_vars['supabase']['SUPABASE_SERVICE_ROLE_KEY']}

# Backend Configuration
SECRET_KEY={self.env_vars['backend']['SECRET_KEY']}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Redis Configuration
REDIS_HOST={self.env_vars['backend']['REDIS_HOST']}
REDIS_PORT={self.env_vars['backend']['REDIS_PORT']}

# SMTP Configuration (Email)
SMTP_HOST={self.env_vars['smtp']['SMTP_HOST']}
SMTP_PORT={self.env_vars['smtp']['SMTP_PORT']}
SMTP_USER={self.env_vars['smtp']['SMTP_USER']}
SMTP_PASSWORD={self.env_vars['smtp']['SMTP_PASSWORD']}
SMTP_FROM_EMAIL={self.env_vars['smtp']['SMTP_FROM_EMAIL']}

# Payment Configuration (Toss Payments)
TOSS_SECRET_KEY={self.env_vars['payment']['TOSS_SECRET_KEY']}

# CORS Configuration
NEXT_PUBLIC_URL=http://localhost:{self.env_vars['frontend']['FRONTEND_PORT']}

# API Server Configuration
BACKEND_PORT={self.env_vars['backend']['BACKEND_PORT']}

# AI Models Configuration (자동 설정)
OLLAMA_HOST=http://localhost:11435
OLLAMA_MODEL=qwen2.5:14b
EMBEDDING_MODEL=BAAI/bge-m3
OLLAMA_TIMEOUT=120

# Recommendation System Settings (자동 설정)
RECOMMENDATION_ANALYSIS_MONTHS=6
RECOMMENDATION_MIN_REVIEWS=3
RECOMMENDATION_PRICE_TOLERANCE=0.3
RECOMMENDATION_DEFAULT_LIMIT=50
RECOMMENDATION_EXCLUDE_PURCHASED=true

# Search Settings (자동 설정)
SEARCH_DOCUMENT_LIMIT=3
SEARCH_PRODUCT_LIMIT=50
SEARCH_MIN_KEYWORD_LENGTH=2
"""

        # Frontend .env.local
        frontend_env_content = f"""# Frontend Environment Configuration
# Generated by setup.py

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL={self.env_vars['supabase']['SUPABASE_URL']}
NEXT_PUBLIC_SUPABASE_ANON_KEY={self.env_vars['supabase']['SUPABASE_ANON_KEY']}

# Backend API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:{self.env_vars['backend']['BACKEND_PORT']}

# Payment Configuration (Toss Payments)
NEXT_PUBLIC_TOSS_CLIENT_KEY={self.env_vars['payment']['TOSS_CLIENT_KEY']}

# Frontend Server Configuration
FRONTEND_PORT={self.env_vars['frontend']['FRONTEND_PORT']}
"""

        # Write backend .env
        backend_env_path = os.path.join("backend", ".env")
        with open(backend_env_path, "w", encoding="utf-8") as f:
            f.write(backend_env_content)
        print_success(f"백엔드 환경 파일이 생성되었습니다: {backend_env_path}")

        # Write frontend .env.local
        frontend_env_path = os.path.join("frontend", ".env.local")
        with open(frontend_env_path, "w", encoding="utf-8") as f:
            f.write(frontend_env_content)
        print_success(f"프론트엔드 환경 파일이 생성되었습니다: {frontend_env_path}")

        print_success("모든 환경 설정 파일이 생성되었습니다.")

    def final_instructions(self):
        print_step(7, self.total_steps, "설치 완료")

        print_success("쇼핑몰 프로젝트 설정이 완료되었습니다!")

        docker_success = False  # Track if docker started successfully

        # Check if this is a retry (progress file exists and step >= 4)
        is_retry = os.path.exists(PROGRESS_FILE) and self.current_step >= 4

        if self.env_vars["setup_method"] == "docker":
            print(f"\n{Colors.CYAN}Docker Compose로 자동 시작합니다...{Colors.ENDC}")

            # If retry, auto-start without asking
            if is_retry:
                print_info("이전 빌드 실패를 감지했습니다. 자동으로 재시도합니다...")
                start_now = 'y'
            else:
                start_now = None

            # Ask if user wants to start immediately
            while True:
                if start_now is None:
                    start_now = input(f"\n지금 바로 시작하시겠습니까? (Y/n): ").strip().lower()

                if start_now in ['y', 'yes', '', 'r', 'retry']:
                    print_info("Docker Compose를 시작하는 중...")
                    print(f"{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.ENDC}\n")
                    try:
                        import subprocess
                        # Start docker-compose with real-time output
                        result = subprocess.run(
                            ["docker-compose", "up", "-d", "--build"],
                            shell=True,
                            encoding='utf-8',
                            errors='replace'
                        )

                        print(f"\n{Colors.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{Colors.ENDC}")

                        if result.returncode == 0:
                            print_success("Docker 컨테이너가 성공적으로 시작되었습니다!")
                            frontend_port = self.env_vars['frontend']['FRONTEND_PORT']
                            backend_port = self.env_vars['backend']['BACKEND_PORT']
                            print(f"\n{Colors.CYAN}서비스 접속:{Colors.ENDC}")
                            print(f"  - 프론트엔드: {Colors.GREEN}http://localhost:{frontend_port}{Colors.ENDC}")
                            print(f"  - 백엔드 API: {Colors.GREEN}http://localhost:{backend_port}{Colors.ENDC}")
                            print(f"  - API 문서: {Colors.GREEN}http://localhost:{backend_port}/docs{Colors.ENDC}")
                            print(f"\n{Colors.CYAN}유용한 명령어:{Colors.ENDC}")
                            print(f"  - 로그 확인: {Colors.GREEN}docker-compose logs -f{Colors.ENDC}")
                            print(f"  - 중지: {Colors.GREEN}docker-compose down{Colors.ENDC}")
                            print(f"  - 재시작: {Colors.GREEN}docker-compose restart{Colors.ENDC}")
                            docker_success = True
                            break
                        else:
                            print_error("Docker 빌드/시작에 실패했습니다.")
                            # Exit on failure - user must fix and re-run
                            break
                    except FileNotFoundError:
                        print_error("docker-compose를 찾을 수 없습니다. Docker가 설치되어 있는지 확인하세요.")
                        print(f"\n{Colors.YELLOW}수동으로 시작하세요:{Colors.ENDC}")
                        print(f"{Colors.GREEN}docker-compose up -d --build{Colors.ENDC}")
                        break
                    except Exception as e:
                        print_error(f"예상치 못한 오류: {e}")
                        print(f"\n{Colors.YELLOW}수동으로 시작하세요:{Colors.ENDC}")
                        print(f"{Colors.GREEN}docker-compose up -d --build{Colors.ENDC}")
                        break
                elif start_now in ['n', 'no']:
                    frontend_port = self.env_vars['frontend']['FRONTEND_PORT']
                    backend_port = self.env_vars['backend']['BACKEND_PORT']
                    print(f"\n{Colors.CYAN}나중에 다음 명령으로 시작하세요:{Colors.ENDC}")
                    print(f"{Colors.GREEN}docker-compose up -d --build{Colors.ENDC}")
                    print(f"\n{Colors.CYAN}서비스 접속:{Colors.ENDC}")
                    print(f"  - 프론트엔드: {Colors.GREEN}http://localhost:{frontend_port}{Colors.ENDC}")
                    print(f"  - 백엔드 API: {Colors.GREEN}http://localhost:{backend_port}{Colors.ENDC}")
                    print(f"  - API 문서: {Colors.GREEN}http://localhost:{backend_port}/docs{Colors.ENDC}")
                    docker_success = True  # User chose to skip, mark as success
                    break
                else:
                    print_error("'y', 'n', 또는 'r'을 입력하세요.")
        else:
            # Manual setup - auto install dependencies
            import subprocess
            import platform

            print(f"\n{Colors.CYAN}수동 설정 모드: 의존성 확인 중...{Colors.ENDC}\n")

            try:
                # 1. Check and install backend dependencies
                print(f"{Colors.YELLOW}[1/3] 백엔드 의존성 확인 중...{Colors.ENDC}")

                # Check if backend dependencies are installed
                fastapi_check = subprocess.run(
                    ["pip", "show", "fastapi"],
                    shell=True,
                    capture_output=True,
                    encoding='utf-8',
                    errors='replace'
                )

                uvicorn_check = subprocess.run(
                    ["pip", "show", "uvicorn"],
                    shell=True,
                    capture_output=True,
                    encoding='utf-8',
                    errors='replace'
                )

                if fastapi_check.returncode != 0 or uvicorn_check.returncode != 0:
                    print_info("백엔드 의존성 설치가 필요합니다. 설치 중...")
                    backend_result = subprocess.run(
                        ["pip", "install", "-r", "backend/requirements.txt"],
                        shell=True,
                        encoding='utf-8',
                        errors='replace'
                    )

                    if backend_result.returncode == 0:
                        print_success("백엔드 의존성 설치 완료")
                    else:
                        print_error("백엔드 의존성 설치 실패")
                else:
                    print_success("백엔드 의존성이 이미 설치되어 있습니다")

                # 2. Check and install frontend dependencies
                print(f"\n{Colors.YELLOW}[2/3] 프론트엔드 의존성 확인 중...{Colors.ENDC}")

                # Check if node_modules exists
                if not os.path.exists("frontend/node_modules"):
                    print_info("프론트엔드 의존성 설치가 필요합니다. 설치 중...")
                    npm_cmd = "npm.cmd" if platform.system() == "Windows" else "npm"
                    frontend_result = subprocess.run(
                        [npm_cmd, "install"],
                        cwd="frontend",
                        shell=True,
                        encoding='utf-8',
                        errors='replace'
                    )

                    if frontend_result.returncode == 0:
                        print_success("프론트엔드 의존성 설치 완료")
                    else:
                        print_error("프론트엔드 의존성 설치 실패")
                else:
                    print_success("프론트엔드 의존성이 이미 설치되어 있습니다")

                # 3. Redis is not required (using memory-based OTP store)
                print(f"\n{Colors.YELLOW}[3/3] Redis 확인 중...{Colors.ENDC}")
                print_info("Redis는 더 이상 필요하지 않습니다 (메모리 기반 OTP 저장소 사용)")
                print_success("Redis 설정 건너뜀")

                # Success message
                print(f"\n{Colors.GREEN}{'='*50}{Colors.ENDC}")
                print_success("의존성 설치가 완료되었습니다!")
                print(f"{Colors.GREEN}{'='*50}{Colors.ENDC}\n")

                # Auto-start services without asking
                print(f"\n{Colors.CYAN}서비스를 시작합니다...{Colors.ENDC}\n")

                # Start backend in background
                print_info("백엔드 서버 시작 중...")
                is_windows = platform.system() == "Windows"

                backend_port = self.env_vars['backend']['BACKEND_PORT']
                if is_windows:
                    # Windows: use START command to open new window with python -m uvicorn
                    backend_proc = subprocess.Popen(
                        f'start "ShoppingMall Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port {backend_port}"',
                        shell=True
                    )
                else:
                    # Linux/Mac: use python3
                    backend_proc = subprocess.Popen(
                        ["python3", "-m", "uvicorn", "app.main:app", "--reload", "--port", backend_port],
                        cwd="backend",
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )

                import time
                time.sleep(2)
                print_success("백엔드 서버가 시작되었습니다")

                # Start frontend in background
                print_info("프론트엔드 서버 시작 중...")
                npm_cmd = "npm.cmd" if is_windows else "npm"

                if is_windows:
                    # Windows: use START command to open new window
                    frontend_proc = subprocess.Popen(
                        'start "ShoppingMall Frontend" cmd /k "cd frontend && npm run dev"',
                        shell=True
                    )
                else:
                    # Linux/Mac
                    frontend_proc = subprocess.Popen(
                        [npm_cmd, "run", "dev"],
                        cwd="frontend",
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )

                time.sleep(2)
                print_success("프론트엔드 서버가 시작되었습니다")

                print(f"\n{Colors.GREEN}{'='*50}{Colors.ENDC}")
                print_success("모든 서비스가 시작되었습니다!")
                print(f"{Colors.GREEN}{'='*50}{Colors.ENDC}\n")

                frontend_port = self.env_vars['frontend']['FRONTEND_PORT']
                backend_port = self.env_vars['backend']['BACKEND_PORT']
                print(f"{Colors.CYAN}서비스 접속:{Colors.ENDC}")
                print(f"  - 프론트엔드: {Colors.GREEN}http://localhost:{frontend_port}{Colors.ENDC}")
                print(f"  - 백엔드 API: {Colors.GREEN}http://localhost:{backend_port}{Colors.ENDC}")
                print(f"  - API 문서: {Colors.GREEN}http://localhost:{backend_port}/docs{Colors.ENDC}\n")

                print(f"{Colors.YELLOW}서비스 중지 방법:{Colors.ENDC}")
                if is_windows:
                    print(f"  - 각 터미널 창에서 {Colors.GREEN}Ctrl+C{Colors.ENDC} 누르기")
                else:
                    print(f"  - 백엔드: {Colors.GREEN}pkill -f uvicorn{Colors.ENDC}")
                    print(f"  - 프론트엔드: {Colors.GREEN}pkill -f 'npm run dev'{Colors.ENDC}")

                docker_success = True

            except Exception as e:
                print_error(f"설치 중 오류 발생: {e}")
                print(f"\n{Colors.YELLOW}수동으로 설치하세요:{Colors.ENDC}")
                print(f"\n{Colors.YELLOW}백엔드:{Colors.ENDC}")
                print(f"{Colors.GREEN}cd backend{Colors.ENDC}")
                print(f"{Colors.GREEN}pip install -r requirements.txt{Colors.ENDC}")
                print(f"\n{Colors.YELLOW}프론트엔드:{Colors.ENDC}")
                print(f"{Colors.GREEN}cd frontend{Colors.ENDC}")
                print(f"{Colors.GREEN}npm install{Colors.ENDC}")
                docker_success = True

        # Clean up progress file ONLY if docker started successfully
        if docker_success and os.path.exists(PROGRESS_FILE):
            os.remove(PROGRESS_FILE)
            print(f"\n{Colors.GREEN}설치가 완료되었습니다! 🎉{Colors.ENDC}\n")
        elif not docker_success:
            print(f"\n{Colors.YELLOW}진행 상황이 저장되었습니다.{Colors.ENDC}")
            print(f"{Colors.YELLOW}문제를 해결한 후 {Colors.GREEN}python setup.py{Colors.YELLOW}를 다시 실행하세요.{Colors.ENDC}\n")

if __name__ == "__main__":
    wizard = SetupWizard()
    wizard.run()