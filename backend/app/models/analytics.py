"""
분석 지표 모델
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RemoteControlMetrics(BaseModel):
    """원격 제어 세션 지표"""
    session_id: str
    duration_seconds: int
    events_count: int
    success: bool
    user_satisfaction: Optional[int] = None  # 1-5
    timestamp: Optional[str] = None


class RAGMetrics(BaseModel):
    """RAG 검색 지표"""
    query: str
    response_time_ms: int
    documents_found: int
    user_rating: Optional[int] = None  # 1-5
    clicked_product: bool = False
    timestamp: Optional[str] = None


class GiftWizardMetrics(BaseModel):
    """선물 마법사 지표"""
    session_id: str
    completed: bool
    recommendations_count: int
    clicked_recommendation: bool = False
    purchased: bool = False
    satisfaction: Optional[int] = None  # 1-5
    timestamp: Optional[str] = None


class AnalyticsSummary(BaseModel):
    """통합 분석 요약"""
    # 원격 제어
    remote_control_sessions: int
    remote_control_avg_duration: float
    remote_control_success_rate: float
    remote_control_satisfaction: float

    # RAG 챗봇
    rag_queries: int
    rag_avg_response_time: float
    rag_accuracy: float
    rag_conversion_rate: float

    # 선물 마법사
    gift_wizard_sessions: int
    gift_wizard_completion_rate: float
    gift_wizard_conversion_rate: float
    gift_wizard_satisfaction: float

    # 전체 통계
    total_users: int
    total_orders: int
    total_products: int
    pending_inquiries: int
    pending_vendors: int

    # 기간
    period_start: str
    period_end: str
