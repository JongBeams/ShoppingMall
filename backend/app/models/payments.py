from pydantic import BaseModel, Field
from typing import Optional, List

"""
Orders 테이블 - 토스페이먼츠 필드 매핑:

DB 필드               토스 응답 필드          설명
------------------------------------------------------------
payment_id       ←   paymentKey           토스 결제 고유 키
order_number     ←   orderId              주문 번호 (토스에 전달한 값)
payment_status   ←   status               결제 상태 (DONE → completed 매핑)
payment_method   ←   method               결제 수단 (카드/가상계좌 등)
paid_at          ←   approvedAt           결제 승인 시각 (ISO 8601)
total            ←   totalAmount          총 결제 금액
status           ←   (고정) "paid"        주문 상태 (결제 완료 시)

매핑 규칙:
- status: DONE → completed, READY → pending, CANCELED → cancelled
- amount: 프론트/서버/토스 3중 검증 필수
- paid_at: approvedAt이 null일 경우 현재 시간 사용 가능
"""

class CardInfo(BaseModel):
    issuerCode: Optional[str]          # 카드 발급사 코드
    acquirerCode: Optional[str]        # 카드 매입사 코드
    number: Optional[str]              # 카드번호(마스킹)
    installmentPlanMonths: int         # 할부 개월 수 (0이면 일시불)
    isInterestFree: bool               # 무이자 여부
    approveNo: Optional[str]           # 승인 번호
    useCardPoint: bool                 # 카드 포인트 사용 여부
    cardType: Optional[str]            # 카드 종류(신용/체크 등)
    ownerType: Optional[str]           # 소유자 유형(개인/법인)
    acquireStatus: Optional[str]       # 매입 상태
    amount: int                        # 해당 수단으로 결제된 금액

class EasyPayInfo(BaseModel):
    provider: Optional[str]            # 간편결제 제공사(토스페이 등)
    amount: int                        # 간편결제 금액
    discountAmount: int                # 간편결제 할인 금액

class ReceiptInfo(BaseModel):
    url: Optional[str]                 # 영수증 URL

class CheckoutInfo(BaseModel):
    url: Optional[str]                 # PG 체크아웃 페이지 URL

class TossPaymentResponse(BaseModel):
    """토스페이먼츠 결제 승인 응답 모델"""
    mId: str                           # 가맹점 ID
    lastTransactionKey: Optional[str]  # 마지막 트랜잭션 키
    paymentKey: str                    # 토스 결제 키(고유)
    orderId: str                       # 상점 주문번호(요청 시 전달한 값)
    orderName: str                     # 주문명
    status: str                        # 결제 상태(READY/DONE/CANCELED 등)
    requestedAt: str                   # 결제 요청 시각
    approvedAt: Optional[str]          # 결제 승인 시각
    totalAmount: int                   # 총 결제 금액
    balanceAmount: int                 # 취소 가능 잔액
    suppliedAmount: int                # 공급가액
    vat: int                           # 부가세
    taxFreeAmount: int                 # 비과세 금액
    method: Optional[str]              # 결제수단(카드/가상계좌 등)
    cultureExpense: bool               # 문화비 지출 여부
    useEscrow: bool                    # 에스크로 사용 여부
    country: Optional[str]             # 결제 국가 코드
    isPartialCancelable: bool          # 부분 취소 가능 여부
    card: Optional[CardInfo]           # 카드 결제 정보
    easyPay: Optional[EasyPayInfo]     # 간편결제 정보
    receipt: Optional[ReceiptInfo]     # 영수증 링크
    checkout: Optional[CheckoutInfo]   # 체크아웃 링크
    failure: Optional[dict] = None     # 실패 시 오류 정보
    metadata: Optional[dict] = None    # 메타데이터(요청 시 전달값 반영)


class PaymentSuccessResponse(BaseModel):
    """결제 성공 처리 응답 모델"""
    message: str                       # 성공 메시지
    order_id: str                      # 주문 DB ID (UUID)
    order_number: str                  # 주문 번호 (orderId)
    payment_key: str                   # 토스 결제 키 (paymentKey)
    payment_status: str                # 매핑된 결제 상태 (completed, pending 등)
    total_amount: float                # 결제 금액
    approved_at: Optional[str]         # 승인 시각


class OrderWithPaymentInfo(BaseModel):
    """결제 정보가 포함된 주문 응답 모델"""
    id: str                            # 주문 ID
    order_number: str                  # 주문 번호
    status: str                        # 주문 상태
    payment_id: Optional[str]          # 토스 결제 키
    payment_status: Optional[str]      # 결제 상태
    payment_method: Optional[str]      # 결제 수단
    paid_at: Optional[str]             # 결제 승인 시각
    total_amount: float                # 주문 총액
    created_at: str                    # 주문 생성 시각


class RefundReceiveAccount(BaseModel):
    """환불 계좌 정보 (가상계좌 결제 취소 시 필수)"""
    bank: str = Field(..., description="은행 코드")
    accountNumber: str = Field(..., description="계좌번호 (- 없이 숫자만)")
    holderName: str = Field(..., description="예금주명")


class CancelPaymentRequest(BaseModel):
    """토스페이먼츠 결제 취소 요청"""
    cancelReason: str = Field(..., description="결제 취소 사유 (최대 200자)", max_length=200)
    cancelAmount: Optional[int] = Field(None, description="취소할 금액 (없으면 전액 취소)")
    cancelRequestId: Optional[str] = Field(None, description="취소 요청 ID (멱등키)")
    currency: Optional[str] = Field(None, description="취소 통화 (KRW, USD, JPY)")
    dividedPayment: Optional[bool] = Field(None, description="분할 결제 여부")
    refundReceiveAccount: Optional[RefundReceiveAccount] = Field(None, description="환불 계좌 정보 (가상계좌만)")
    taxAmount: Optional[int] = Field(None, description="과세 금액")
    taxExemptionAmount: Optional[int] = Field(None, description="과세 제외 금액")
    taxFreeAmount: Optional[int] = Field(None, description="면세 금액")


# ========== 결제수단 모델 ==========
class PaymentMethodCreate(BaseModel):
    """결제수단 생성 요청"""
    card_company: str  # 카드사 (신한, 삼성, 현대 등)
    card_number: str   # 카드번호 (마스킹된 형태로 저장)
    card_holder: str   # 카드 소유자명
    expiry_date: str   # 유효기간 (MM/YY)
    is_default: bool = False


class PaymentMethodResponse(BaseModel):
    """결제수단 응답"""
    id: str
    card_company: str
    card_number: str
    card_holder: str
    expiry_date: str
    is_default: bool
    created_at: str


class PaymentMethodListResponse(BaseModel):
    """결제수단 목록 응답"""
    payment_methods: List[PaymentMethodResponse]


# ========== 환불계좌 모델 ==========
class RefundAccountCreate(BaseModel):
    """환불계좌 생성 요청"""
    bank_name: str      # 은행명
    account_number: str # 계좌번호
    account_holder: str # 예금주
    is_default: bool = False


class RefundAccountResponse(BaseModel):
    """환불계좌 응답"""
    id: str
    bank_name: str
    account_number: str
    account_holder: str
    is_default: bool
    created_at: str


class RefundAccountListResponse(BaseModel):
    """환불계좌 목록 응답"""
    refund_accounts: List[RefundAccountResponse]


# ========== 배송지 모델 ==========
class AddressCreate(BaseModel):
    """배송지 생성 요청"""
    name: str           # 배송지명 (자택, 회사 등)
    recipient: str      # 수령인
    phone: str          # 연락처
    postal_code: str    # 우편번호
    address: str        # 기본주소
    detail_address: str = ""  # 상세주소
    is_default: bool = False


class AddressUpdate(BaseModel):
    """배송지 수정 요청"""
    name: Optional[str] = None
    recipient: Optional[str] = None
    phone: Optional[str] = None
    postal_code: Optional[str] = None
    address: Optional[str] = None
    detail_address: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(BaseModel):
    """배송지 응답"""
    id: str
    name: str
    recipient: str
    phone: str
    postal_code: str
    address: str
    detail_address: str
    is_default: bool
    created_at: str


class AddressListResponse(BaseModel):
    """배송지 목록 응답"""
    addresses: List[AddressResponse]
