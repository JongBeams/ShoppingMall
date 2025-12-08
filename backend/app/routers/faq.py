from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.services.supabase import get_supabase_admin_client
from app.services.auth_middleware import get_current_admin
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/faqs", tags=["FAQs"])


class FAQCreate(BaseModel):
    """FAQ 생성 요청"""
    question: str
    answer: str
    category: Optional[str] = None
    is_published: bool = True


class FAQUpdate(BaseModel):
    """FAQ 수정 요청"""
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None


class FAQResponse(BaseModel):
    """FAQ 응답"""
    id: str
    question: str
    answer: str
    category: Optional[str]
    is_published: bool
    views: int
    created_at: str
    updated_at: str
    author_name: str


@router.get("", response_model=List[FAQResponse])
async def get_faqs(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None
):
    """FAQ 목록 조회"""
    supabase = get_supabase_admin_client()

    try:
        # FAQ 조회 (admin_users 조인)
        query = supabase.table("faqs").select(
            "*, admin_users(full_name)"
        ).order("created_at", desc=True)

        if search:
            query = query.or_(f"question.ilike.%{search}%,answer.ilike.%{search}%")

        if category:
            query = query.eq("category", category)

        query = query.range(skip, skip + limit - 1)
        response = query.execute()

        faqs = []
        for faq in response.data:
            faqs.append(FAQResponse(
                id=faq["id"],
                question=faq["question"],
                answer=faq["answer"],
                category=faq.get("category"),
                is_published=faq["is_published"],
                views=faq["views"],
                created_at=faq["created_at"],
                updated_at=faq["updated_at"],
                author_name=faq["admin_users"]["full_name"] if faq.get("admin_users") else "관리자"
            ))

        return faqs

    except Exception as e:
        logger.error(f"FAQ 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FAQ 목록 조회 중 오류가 발생했습니다."
        )


@router.get("/{faq_id}", response_model=FAQResponse)
async def get_faq(faq_id: str):
    """FAQ 상세 조회"""
    supabase = get_supabase_admin_client()

    try:
        # 조회수 증가
        supabase.rpc("increment_faq_views", {"faq_id": faq_id}).execute()

        # FAQ 조회
        response = supabase.table("faqs").select(
            "*, admin_users(full_name)"
        ).eq("id", faq_id).single().execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="FAQ를 찾을 수 없습니다."
            )

        faq = response.data
        return FAQResponse(
            id=faq["id"],
            question=faq["question"],
            answer=faq["answer"],
            category=faq.get("category"),
            is_published=faq["is_published"],
            views=faq["views"],
            created_at=faq["created_at"],
            updated_at=faq["updated_at"],
            author_name=faq["admin_users"]["full_name"] if faq.get("admin_users") else "관리자"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"[ERROR] FAQ 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FAQ 조회 중 오류가 발생했습니다."
        )


@router.post("", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
async def create_faq(
    faq_data: FAQCreate,
    admin: dict = Depends(get_current_admin)
):
    """FAQ 생성 (관리자 전용)"""
    supabase = get_supabase_admin_client()

    try:
        # FAQ 생성
        response = supabase.table("faqs").insert({
            "question": faq_data.question,
            "answer": faq_data.answer,
            "category": faq_data.category,
            "is_published": faq_data.is_published,
            "author_id": admin["id"],
            "views": 0
        }).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="FAQ 생성에 실패했습니다."
            )

        faq = response.data[0]

        return FAQResponse(
            id=faq["id"],
            question=faq["question"],
            answer=faq["answer"],
            category=faq.get("category"),
            is_published=faq["is_published"],
            views=faq["views"],
            created_at=faq["created_at"],
            updated_at=faq["updated_at"],
            author_name=admin["full_name"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"[ERROR] FAQ 생성 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FAQ 생성 중 오류가 발생했습니다."
        )


@router.put("/{faq_id}", response_model=FAQResponse)
async def update_faq(
    faq_id: str,
    faq_data: FAQUpdate,
    admin: dict = Depends(get_current_admin)
):
    """FAQ 수정 (관리자 전용)"""
    supabase = get_supabase_admin_client()

    try:
        # FAQ 존재 확인
        existing = supabase.table("faqs").select("*").eq("id", faq_id).single().execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="FAQ를 찾을 수 없습니다."
            )

        # 업데이트할 데이터 준비
        update_data = {}
        if faq_data.question is not None:
            update_data["question"] = faq_data.question
        if faq_data.answer is not None:
            update_data["answer"] = faq_data.answer
        if faq_data.category is not None:
            update_data["category"] = faq_data.category
        if faq_data.is_published is not None:
            update_data["is_published"] = faq_data.is_published

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="수정할 내용이 없습니다."
            )

        # FAQ 수정
        response = supabase.table("faqs").update(update_data).eq("id", faq_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="FAQ 수정에 실패했습니다."
            )

        faq = response.data[0]

        return FAQResponse(
            id=faq["id"],
            question=faq["question"],
            answer=faq["answer"],
            category=faq.get("category"),
            is_published=faq["is_published"],
            views=faq["views"],
            created_at=faq["created_at"],
            updated_at=faq["updated_at"],
            author_name=admin["full_name"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.info(f"[ERROR] FAQ 수정 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FAQ 수정 중 오류가 발생했습니다."
        )


@router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(
    faq_id: str,
    admin: dict = Depends(get_current_admin)
):
    """FAQ 삭제 (관리자 전용)"""
    supabase = get_supabase_admin_client()

    try:
        # FAQ 존재 확인
        existing = supabase.table("faqs").select("id").eq("id", faq_id).single().execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="FAQ를 찾을 수 없습니다."
            )

        # FAQ 삭제
        supabase.table("faqs").delete().eq("id", faq_id).execute()

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] FAQ 삭제 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="FAQ 삭제 중 오류가 발생했습니다."
        )
