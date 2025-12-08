# 📡 API 엔드포인트 문서

## 전체 API 개요

**Base URL**: `https://api.example.com`
**API Version**: v1
**총 엔드포인트 수**: 100+

---

## 인증 (Authentication)

### `POST /auth/send-otp`
OTP 코드 이메일 전송

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "OTP 코드가 이메일로 전송되었습니다",
  "expires_in": 300
}
```

---

### `POST /auth/verify-otp`
OTP 코드 검증

**Request**:
```json
{
  "email": "user@example.com",
  "token": "123456"
}
```

**Response**:
```json
{
  "message": "OTP 인증 성공",
  "verified": true
}
```

---

### `POST /auth/register`
회원가입 (구매자/판매자)

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123!",
  "full_name": "홍길동",
  "phone": "010-1234-5678",
  "user_type": "buyer",

  // 판매자만 필수
  "business_name": "홍길동 상점",
  "business_number": "123-45-67890",
  "store_name": "길동샵"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "expires_in": 7200,
  "refresh_token": "refresh_abc123",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "홍길동",
    "user_type": "buyer"
  }
}
```

---

### `POST /auth/login`
로그인

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123!"
}
```

**Response**: (회원가입과 동일)

---

### `POST /auth/refresh`
Access Token 갱신

**Request**:
```json
{
  "refresh_token": "refresh_abc123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "refresh_new456"
}
```

---

### `POST /auth/logout`
로그아웃 (Refresh Token 무효화)

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "message": "로그아웃 되었습니다"
}
```

---

### `GET /auth/me`
현재 사용자 정보 조회

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "홍길동",
  "phone": "010-1234-5678",
  "avatar_url": "https://...",
  "user_type": "buyer",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

## 상품 (Products)

### `GET /products/`
상품 목록 조회

**Query Parameters**:
- `category_id` (UUID): 카테고리 필터
- `min_price` (int): 최소 가격
- `max_price` (int): 최대 가격
- `tags` (string): 태그 (쉼표 구분)
- `sort` (string): `price_asc`, `price_desc`, `rating_desc`, `sale_count_desc`
- `page` (int): 페이지 번호 (default: 1)
- `limit` (int): 페이지 크기 (default: 20)

**Example**: `GET /products/?category_id=uuid&sort=rating_desc&page=1&limit=20`

**Response**:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "프리미엄 가죽 토트백",
      "price": 89000,
      "discount_price": 79000,
      "thumbnail_url": "https://...",
      "rating": 4.8,
      "review_count": 156,
      "sale_count": 523,
      "tags": ["미니멀", "가죽", "토트백"]
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "total_pages": 8
}
```

---

### `GET /products/search`
상품 검색 (텍스트)

**Query Parameters**:
- `q` (string): 검색어 (필수)
- `page`, `limit`: 페이징

**Example**: `GET /products/search?q=가방&page=1`

**Response**: (상품 목록과 동일)

---

### `POST /products/search-by-image`
이미지 기반 유사 상품 검색 (CLIP)

**Request**:
```json
{
  "image_data": "data:image/jpeg;base64,/9j/4AAQ...",
  "threshold": 0.3,
  "limit": 20
}
```

**Response**:
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "가죽 토트백",
      "price": 89000,
      "thumbnail_url": "https://...",
      "similarity": 0.87
    }
  ],
  "count": 15,
  "query_time_ms": 52
}
```

---

### `GET /products/{product_id}`
상품 상세 조회

**Response**:
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "vendor_name": "길동샵",
  "category_id": "uuid",
  "category_name": "가방",
  "name": "프리미엄 가죽 토트백",
  "description": "소가죽으로 제작된...",
  "price": 89000,
  "discount_price": 79000,
  "stock_quantity": 45,
  "images": [
    "https://cdn.example.com/image1.jpg",
    "https://cdn.example.com/image2.jpg"
  ],
  "tags": ["미니멀", "가죽"],
  "rating": 4.8,
  "review_count": 156,
  "view_count": 3452,
  "sale_count": 523,
  "options": [
    {
      "id": "uuid",
      "custom_type": "색상",
      "values": [
        {"id": "uuid", "value": "검정", "price": 0, "stock": 20},
        {"id": "uuid", "value": "갈색", "price": 0, "stock": 15}
      ]
    }
  ]
}
```

---

### `GET /products/categories`
카테고리 목록

**Response**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "패션",
      "slug": "fashion",
      "parent_id": null,
      "children": [
        {
          "id": "uuid",
          "name": "의류",
          "slug": "fashion-clothes",
          "parent_id": "패션_uuid"
        }
      ]
    }
  ]
}
```

---

## 판매자 상품 관리 (Vendor Products)

### `GET /products/management`
판매자 본인 상품 목록

**Headers**: `Authorization: Bearer {seller_token}`

**Response**:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "프리미엄 가죽 토트백",
      "price": 89000,
      "stock_quantity": 45,
      "is_active": true,
      "view_count": 3452,
      "sale_count": 523
    }
  ]
}
```

---

### `POST /products/management/{product_id}`
상품 생성/수정

**Headers**: `Authorization: Bearer {seller_token}`

**Request**:
```json
{
  "id": null,  // null이면 신규 생성
  "name": "프리미엄 가죽 토트백",
  "meta_description": "소가죽 명품 토트백",
  "description": "상세 설명...",
  "price": 89000,
  "category": "가방",
  "stock_quantity": 45,
  "low_stock_threshold": 10,
  "image_url": "https://...",
  "image_urls": ["https://...", "https://..."],
  "tags": ["미니멀", "가죽"],
  "options": [
    {
      "customType": "색상",
      "values": [
        {"value": "검정", "price": "0", "stock": "20"},
        {"value": "갈색", "price": "0", "stock": "15"}
      ]
    }
  ]
}
```

**Response**:
```json
{
  "message": "상품이 생성되었습니다",
  "product_id": "uuid"
}
```

---

### `POST /products/product-image/{product_id}`
상품 이미지 업로드 (최대 5개)

**Headers**: `Authorization: Bearer {seller_token}`

**Request**: `multipart/form-data`
```
file: (binary)
```

**Response**:
```json
{
  "image_url": "https://cdn.example.com/product123.jpg"
}
```

---

### `DELETE /products/management/{product_id}`
상품 삭제

**Headers**: `Authorization: Bearer {seller_token}`

**Response**:
```json
{
  "message": "상품이 삭제되었습니다"
}
```

---

## 장바구니 (Cart)

### `GET /cart`
장바구니 조회

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "name": "프리미엄 가죽 토트백",
        "price": 89000,
        "thumbnail_url": "https://..."
      },
      "quantity": 2,
      "selected_options": [
        {"option_id": "uuid", "value_id": "uuid", "value_name": "검정"}
      ],
      "subtotal": 178000
    }
  ],
  "total": 178000,
  "total_items": 1
}
```

---

### `POST /cart`
장바구니에 상품 추가

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "product_id": "uuid",
  "quantity": 2,
  "selected_options": [
    {"option_id": "uuid", "value_id": "uuid"}
  ]
}
```

**Response**:
```json
{
  "message": "장바구니에 추가되었습니다",
  "cart_item_id": "uuid"
}
```

---

### `PATCH /cart/{item_id}`
장바구니 수량 변경

**Request**:
```json
{
  "quantity": 3
}
```

---

### `DELETE /cart/{item_id}`
장바구니 항목 삭제

---

### `DELETE /cart`
장바구니 전체 비우기

---

## 주문 (Orders)

### `POST /orders`
주문 생성

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 1,
      "selected_options": [...]
    }
  ],
  "shipping_address": {
    "recipient_name": "홍길동",
    "recipient_phone": "010-1234-5678",
    "postal_code": "06234",
    "address": "서울시 강남구 테헤란로 123",
    "address_detail": "2층"
  },
  "notes": "문 앞에 놔주세요",
  "points_to_use": 1000
}
```

**Response**:
```json
{
  "order_id": "uuid",
  "order_number": "ORD-20250101-A1B2C3",
  "toss_order_id": "nanoid123",
  "total": 88000,
  "status": "pending"
}
```

---

### `POST /orders/success`
Toss Payments 결제 성공 처리

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "orderId": "nanoid123",
  "paymentKey": "toss_paymentKey_abc",
  "amount": 88000
}
```

**Response**:
```json
{
  "message": "결제가 완료되었습니다",
  "order_id": "uuid",
  "order_number": "ORD-20250101-A1B2C3",
  "payment_key": "toss_paymentKey_abc",
  "payment_status": "completed",
  "total_amount": 88000,
  "approved_at": "2025-01-01T12:34:56Z"
}
```

---

### `GET /orders`
주문 목록 조회

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `status` (string): `pending`, `paid`, `shipping`, `delivered`, `confirmed`, `cancelled`
- `page`, `limit`: 페이징

**Response**:
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-20250101-A1B2C3",
      "status": "shipped",
      "total": 88000,
      "items_count": 2,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /orders/{order_id}`
주문 상세 조회

**Response**:
```json
{
  "id": "uuid",
  "order_number": "ORD-20250101-A1B2C3",
  "status": "shipped",
  "items": [
    {
      "product_name": "프리미엄 가죽 토트백",
      "quantity": 1,
      "price": 89000,
      "selected_options": [...]
    }
  ],
  "subtotal": 89000,
  "shipping_fee": 3000,
  "discount": 0,
  "points_used": 1000,
  "total": 91000,
  "shipping_address": {...},
  "payment_method": "card",
  "paid_at": "2025-01-01T12:34:56Z"
}
```

---

### `PATCH /orders/{order_id}/cancel`
주문 취소

**Response**:
```json
{
  "message": "주문이 취소되었습니다",
  "refund_amount": 91000
}
```

---

### `POST /orders/{order_id}/confirm`
구매 확정 (배송 완료 후)

**Response**:
```json
{
  "message": "구매가 확정되었습니다",
  "points_earned": 910
}
```

---

## 리뷰 (Reviews)

### `POST /reviews`
리뷰 작성

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "order_id": "uuid",
  "product_id": "uuid",
  "rating": 5,
  "content": "품질이 정말 좋아요!",
  "images": ["https://..."]
}
```

**Response**:
```json
{
  "message": "리뷰가 등록되었습니다",
  "review_id": "uuid",
  "points_earned": 500
}
```

---

### `GET /reviews/product/{product_id}`
상품 리뷰 목록

**Query Parameters**:
- `sort` (string): `recent`, `rating_desc`, `rating_asc`, `helpful`
- `page`, `limit`

**Response**:
```json
{
  "reviews": [
    {
      "id": "uuid",
      "user_name": "홍*동",
      "rating": 5,
      "content": "품질이 정말 좋아요!",
      "images": ["https://..."],
      "helpful_count": 12,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 156,
  "average_rating": 4.8
}
```

---

### `POST /reviews/summary/{product_id}`
AI 리뷰 요약 생성 (Streaming)

**Response**: Server-Sent Events (SSE)
```
data: {"chunk": "이 상품은"}
data: {"chunk": " 품질이"}
data: {"chunk": " 뛰어나며"}
...
data: {"done": true}
```

---

## 포인트 (Points)

### `GET /points/balance`
포인트 잔액 조회

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "balance": 5430,
  "expires_soon": 500,
  "expires_at": "2025-06-01T00:00:00Z"
}
```

---

### `GET /points/transactions`
포인트 내역 조회

**Query Parameters**:
- `change_type` (string): `earn`, `use`, `expire`, `cancel`
- `page`, `limit`

**Response**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "change_amount": 910,
      "balance_after": 5430,
      "change_type": "earn",
      "reason": "order_reward",
      "created_at": "2025-01-01T00:00:00Z",
      "expires_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /points/expiring`
만료 예정 포인트

**Query Parameters**:
- `days` (int): 몇 일 이내 (default: 30)

**Response**:
```json
{
  "expiring_points": 500,
  "expires_at": "2025-02-01T00:00:00Z"
}
```

---

## 구독 (Subscriptions)

### `GET /subscriptions/plans`
구독 플랜 목록

**Response**:
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "프리미엄 (구매자)",
      "slug": "buyer-premium",
      "price": 9900,
      "duration_days": 30,
      "is_buyer": true,
      "features": {
        "free_shipping": true,
        "exclusive_deals": true,
        "priority_support": true,
        "extra_points": 2
      }
    }
  ]
}
```

---

### `POST /subscriptions/confirm`
구독 결제 완료

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "plan_id": "uuid",
  "paymentKey": "toss_key",
  "orderId": "nanoid",
  "amount": 9900
}
```

**Response**:
```json
{
  "message": "구독이 활성화되었습니다",
  "subscription_id": "uuid",
  "started_at": "2025-01-01T00:00:00Z",
  "ended_at": "2025-01-31T23:59:59Z"
}
```

---

### `GET /subscriptions/my`
내 구독 정보

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "subscription": {
    "id": "uuid",
    "plan_name": "프리미엄 (구매자)",
    "is_active": true,
    "started_at": "2025-01-01T00:00:00Z",
    "ended_at": "2025-01-31T23:59:59Z",
    "features": {...}
  }
}
```

---

## 선물 추천 (Gift Wizard)

### `POST /gift-wizard/recommendations`
AI 선물 추천 (Streaming)

**Request**:
```json
{
  "recipient_relationship": "연인_남",
  "recipient_age_range": "30대",
  "recipient_gender": "male",
  "recipient_style": "미니멀",
  "recipient_interests": ["테크", "패션"],
  "occasion": "생일",
  "budget_min": 50000,
  "budget_max": 150000,
  "special_request": "실용적인 것 추천해줘"
}
```

**Response**: Server-Sent Events (SSE)
```
data: {"chunk": "{\"recommendations\": ["}
data: {"chunk": "{\"rank\": 1, \"product_number\": 2, ...}"}
...
data: {"done": true, "recommendations": [...]}
```

---

### `POST /gift-wizard/messages`
선물 메시지 생성

**Request**:
```json
{
  "product_name": "프리미엄 가죽 지갑",
  "recipient_relationship": "연인_남",
  "occasion": "생일"
}
```

**Response**:
```json
{
  "messages": {
    "romantic": "당신의 소중한 순간을 함께하는 특별한 선물",
    "casual": "생일 축하해! 마음에 들었으면 좋겠어",
    "formal": "진심을 담아 정성스럽게 준비했습니다"
  }
}
```

---

### `POST /gift-wizard/history`
선물 이력 저장

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "recipient_relationship": "연인_남",
  "occasion": "생일",
  "product_id": "uuid",
  "given_date": "2025-01-01"
}
```

---

### `GET /gift-wizard/history`
선물 이력 조회

**Headers**: `Authorization: Bearer {access_token}`

---

### `POST /gift-wizard/anniversaries`
기념일 등록

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "name": "엄마 생신",
  "date": "1960-05-15",
  "auto_remind": true,
  "remind_days_before": 30
}
```

---

### `GET /gift-wizard/anniversaries`
기념일 목록

**Headers**: `Authorization: Bearer {access_token}`

---

## 채팅 (Chat)

### `POST /chat/rooms`
채팅방 생성

**Headers**: `Authorization: Bearer {access_token}`

**Request**:
```json
{
  "user_id": "uuid",
  "user_name": "홍길동"
}
```

**Response**:
```json
{
  "room_id": "uuid",
  "status": "waiting"
}
```

---

### `WS /chat/ws/{room_id}`
WebSocket 채팅 연결

**Message Format**:
```json
// Client → Server
{
  "type": "message",
  "message": "안녕하세요"
}

// Server → Client
{
  "type": "message",
  "sender_type": "admin",
  "sender_name": "관리자",
  "message": "무엇을 도와드릴까요?",
  "timestamp": "2025-01-01T12:34:56Z"
}
```

---

### `POST /chat/smart`
스마트 AI 챗봇 (RAG + 개인화)

**Request**:
```json
{
  "message": "이 쇼핑몰의 배송 정책은 어떻게 되나요?"
}
```

**Response**: Server-Sent Events (SSE)

---

## 위시리스트 (Wishlist)

### `GET /wishlist`
위시리스트 조회

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "name": "프리미엄 가죽 토트백",
        "price": 89000,
        "thumbnail_url": "https://..."
      },
      "added_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### `POST /wishlist`
위시리스트 추가

**Request**:
```json
{
  "product_id": "uuid"
}
```

---

### `DELETE /wishlist/{item_id}`
위시리스트 삭제

---

### `GET /wishlist/check/{product_id}`
상품이 위시리스트에 있는지 확인

**Response**:
```json
{
  "in_wishlist": true,
  "wishlist_item_id": "uuid"
}
```

---

## 알림 (Notifications)

### `GET /notifications`
알림 목록

**Headers**: `Authorization: Bearer {access_token}`

**Query Parameters**:
- `type` (string): `order`, `shipment`, `coupon`, `event`
- `is_read` (boolean): 읽음 여부 필터
- `page`, `limit`

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "order",
      "title": "주문이 배송 중입니다",
      "summary": "프리미엄 가죽 토트백",
      "is_read": false,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "unread_count": 5
}
```

---

### `GET /notifications/unread-count`
읽지 않은 알림 수

**Response**:
```json
{
  "unread_count": 5
}
```

---

### `PATCH /notifications/{notification_id}/read`
알림 읽음 처리

---

### `POST /notifications/mark-all-read`
모든 알림 읽음 처리

---

## 관리자 (Admin)

### `POST /admin/login`
관리자 로그인

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

**Response**:
```json
{
  "access_token": "admin_token",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "관리자",
    "role": "admin"
  }
}
```

---

### `GET /admin/vendors/pending`
승인 대기 판매자 목록

**Headers**: `Authorization: Bearer {admin_token}`

**Response**:
```json
{
  "vendors": [
    {
      "id": "uuid",
      "business_name": "홍길동 상점",
      "store_name": "길동샵",
      "approval_status": "pending",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### `PATCH /admin/vendors/{vendor_id}/approve`
판매자 승인

**Response**:
```json
{
  "message": "판매자가 승인되었습니다"
}
```

---

### `PATCH /admin/vendors/{vendor_id}/reject`
판매자 거부

**Request**:
```json
{
  "reason": "사업자등록번호 불일치"
}
```

---

## 분석 (Analytics)

### `GET /analytics/summary`
대시보드 요약 통계

**Headers**: `Authorization: Bearer {admin_token}`

**Response**:
```json
{
  "today_sales": 1250000,
  "today_orders": 34,
  "month_sales": 45600000,
  "month_growth": 12.5,
  "total_users": 10523,
  "total_products": 2341,
  "top_products": [...]
}
```

---

## 에러 응답

모든 API는 에러 시 다음 형식을 반환합니다:

```json
{
  "detail": "에러 메시지",
  "error_code": "INVALID_CREDENTIALS",
  "timestamp": "2025-01-01T12:34:56Z"
}
```

**주요 HTTP 상태 코드**:
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `422 Unprocessable Entity`: 유효성 검사 실패
- `429 Too Many Requests`: Rate Limit 초과
- `500 Internal Server Error`: 서버 오류

---

## Rate Limiting

**기본 제한**:
- 100 requests/minute per IP
- 2000 requests/hour per IP
- 10000 requests/day per IP

**민감한 엔드포인트 추가 제한**:
- `/auth/login`: 5 requests/minute
- `/auth/send-otp`: 3 requests/minute
- `/orders/success`: 10 requests/minute

**Rate Limit 초과 응답**:
```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds.",
  "retry_after": 60
}
```
