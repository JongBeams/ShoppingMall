# 쇼핑몰 모바일 앱 (React Native + Expo)

AI 기반 쇼핑몰의 React Native 모바일 애플리케이션입니다.

## 📱 기술 스택

- **React Native** + **Expo SDK**
- **TypeScript**
- **React Navigation** (Native Stack + Bottom Tabs)
- **Axios** (API 통신)
- **Expo Secure Store** (토큰 저장)
- **Expo Image** (이미지 최적화)
- **TanStack Query** (데이터 캐싱)

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd mobile
npm install
```

### 2. 백엔드 서버 실행

먼저 백엔드 API 서버가 실행 중이어야 합니다:

```bash
# 프로젝트 루트에서
cd backend
python -m uvicorn app.main:app --reload
```

### 3. 앱 실행

#### iOS 시뮬레이터 (macOS만 가능)
```bash
npm run ios
```

#### Android 에뮬레이터
```bash
npm run android
```

#### Expo Go 앱으로 테스트 (권장)
```bash
npm start
```

그 다음:
1. 스마트폰에 **Expo Go** 앱 설치
   - [iOS](https://apps.apple.com/app/apple-store/id982107779)
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. QR 코드 스캔

## 📂 프로젝트 구조

```
mobile/
├── src/
│   ├── navigation/          # 네비게이션 설정
│   │   └── RootNavigator.tsx
│   ├── screens/             # 화면 컴포넌트
│   │   ├── auth/            # 인증 (로그인, 회원가입)
│   │   ├── home/            # 홈 화면
│   │   ├── product/         # 상품 목록/상세
│   │   ├── cart/            # 장바구니
│   │   ├── mypage/          # 마이페이지
│   │   └── order/           # 주문 내역
│   ├── services/            # API 서비스
│   │   ├── api.ts           # Axios 인스턴스
│   │   └── auth.ts          # 인증 서비스
│   ├── types/               # TypeScript 타입 정의
│   │   └── index.ts
│   └── constants/           # 상수 (색상, 스타일 등)
│       └── config.ts
├── App.tsx                  # 앱 엔트리 포인트
└── package.json
```

## 🎨 구현된 화면

### ✅ 인증
- [x] 로그인
- [x] 회원가입
- [x] 자동 로그인 (토큰 저장)
- [x] 토큰 갱신

### ✅ 메인 탭
- [x] **홈**: 특가 상품, 베스트 상품
- [x] **상품**: 상품 목록, 검색
- [x] **장바구니**: 상품 추가/삭제, 수량 조절
- [x] **마이페이지**: 프로필, 주문 내역, 설정

### ✅ 상품
- [x] 상품 목록 (그리드 뷰)
- [x] 상품 검색
- [x] 상품 상세
- [x] 할인율 표시
- [x] 장바구니 담기

### ✅ 주문
- [x] 주문 내역 조회
- [x] 주문 상태별 표시

## 🔧 설정

### API 베이스 URL 변경

`src/constants/config.ts` 파일에서 API URL을 변경할 수 있습니다:

```typescript
export const API_BASE_URL = 'http://localhost:8000';
```

**실제 기기 테스트 시**:
- `localhost` → 컴퓨터의 로컬 IP 주소로 변경
- 예: `http://192.168.0.10:8000`

### 색상 커스터마이징

`src/constants/config.ts`에서 앱의 색상을 변경할 수 있습니다:

```typescript
export const COLORS = {
  primary: '#000000',      // 메인 색상
  secondary: '#ffffff',    // 서브 색상
  accent: '#3b82f6',       // 강조 색상
  // ...
};
```

## 📦 빌드

### Android APK 빌드

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# 빌드 설정
eas build:configure

# APK 빌드
eas build --platform android --profile preview
```

### iOS IPA 빌드 (macOS + Apple Developer 계정 필요)

```bash
eas build --platform ios --profile preview
```

## 🔮 향후 추가 예정 기능

- [ ] 푸시 알림 (Expo Notifications + FCM)
- [ ] 이미지 검색 (카메라)
- [ ] AI 선물 추천
- [ ] RAG 챗봇
- [ ] 생체 인증 (지문/Face ID)
- [ ] 오프라인 모드
- [ ] 다크 모드
- [ ] 다국어 지원

## 🐛 문제 해결

### Android 에뮬레이터에서 API 연결 안 됨
- `API_BASE_URL`을 `http://10.0.2.2:8000`으로 변경 (Android 에뮬레이터의 호스트 머신 주소)

### iOS 시뮬레이터에서 이미지 안 보임
- HTTPS 이미지만 표시됩니다. HTTP는 `info.plist` 설정 필요

### 토큰 만료 오류
- 앱을 재시작하거나 로그아웃 후 다시 로그인

## 📄 라이선스

MIT License
