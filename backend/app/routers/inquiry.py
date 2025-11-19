from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.services.supabase import get_supabase_admin_client
from app.services.auth_middleware import get_current_user, get_current_admin
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/inquiries", tags=["Inquiry"])


class InquiryCreateRequest(BaseModel):
    title: str
    content: str
    category: str  # '배송', '결제', '제품', '기타'


class InquiryResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_type: str
    title: str
    content: str
    category: str
    status: str  # 'pending', 'answered', 'closed'
    admin_reply: Optional[str]
    admin_name: Optional[str]
    replied_at: Optional[str]
    created_at: str
    updated_at: str


class InquiryListResponse(BaseModel):
    inquiries: List[InquiryResponse]
    total: int


class InquiryReplyRequest(BaseModel):
    admin_reply: str


class MessageResponse(BaseModel):
    message: str


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    inquiry_data: InquiryCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """1:1 문의 작성 (일반회원/판매자)"""
    supabase_admin = get_supabase_admin_client()

    try:
        inquiry_insert_data = {
            "user_id": current_user["id"],
            "title": inquiry_data.title,
            "content": inquiry_data.content,
            "category": inquiry_data.category,
            "status": "pending",
        }

        response = supabase_admin.table("inquiries").insert(inquiry_insert_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="문의 작성에 실패했습니다."
            )

        return MessageResponse(message="문의가 등록되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 문의 작성 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문의 작성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/my", response_model=InquiryListResponse)
async def get_my_inquiries(current_user: dict = Depends(get_current_user)):
    """내 문의 목록 조회"""
    supabase_admin = get_supabase_admin_client()

    try:
        # 문의 조회
        response = supabase_admin.table("inquiries").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()

        if not response.data:
            return InquiryListResponse(inquiries=[], total=0)

        inquiries_list = []
        for inquiry in response.data:
            # 관리자 정보 조회
            admin_name = None
            if inquiry.get("admin_id"):
                admin_response = supabase_admin.table("admin_users").select("full_name").eq("id", inquiry["admin_id"]).execute()
                if admin_response.data:
                    admin_name = admin_response.data[0]["full_name"]

            inquiries_list.append(InquiryResponse(
                id=inquiry["id"],
                user_id=current_user["id"],
                user_name=current_user["full_name"],
                user_type=current_user["user_type"],
                title=inquiry["title"],
                content=inquiry["content"],
                category=inquiry["category"],
                status=inquiry["status"],
                admin_reply=inquiry.get("admin_reply"),
                admin_name=admin_name,
                replied_at=inquiry.get("replied_at"),
                created_at=inquiry["created_at"],
                updated_at=inquiry["updated_at"]
            ))

        return InquiryListResponse(inquiries=inquiries_list, total=len(inquiries_list))

    except Exception as e:
        import traceback
        print(f"[ERROR] 내 문의 목록 조회 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문의 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("", response_model=InquiryListResponse)
async def get_all_inquiries(current_admin: dict = Depends(get_current_admin)):
    """전체 문의 목록 조회 (관리자용)"""
    supabase_admin = get_supabase_admin_client()

    try:
        # 모든 문의 조회
        response = supabase_admin.table("inquiries").select("*").order("created_at", desc=True).execute()

        if not response.data:
            return InquiryListResponse(inquiries=[], total=0)

        inquiries_list = []
        for inquiry in response.data:
            # 사용자 정보 조회
            user_response = supabase_admin.table("profiles").select("full_name, user_type").eq("id", inquiry["user_id"]).execute()
            user_name = user_response.data[0]["full_name"] if user_response.data else "알 수 없음"
            user_type = user_response.data[0]["user_type"] if user_response.data else "buyer"

            # 관리자 정보 조회
            admin_name = None
            if inquiry.get("admin_id"):
                admin_response = supabase_admin.table("admin_users").select("full_name").eq("id", inquiry["admin_id"]).execute()
                if admin_response.data:
                    admin_name = admin_response.data[0]["full_name"]

            inquiries_list.append(InquiryResponse(
                id=inquiry["id"],
                user_id=inquiry["user_id"],
                user_name=user_name,
                user_type=user_type,
                title=inquiry["title"],
                content=inquiry["content"],
                category=inquiry["category"],
                status=inquiry["status"],
                admin_reply=inquiry.get("admin_reply"),
                admin_name=admin_name,
                replied_at=inquiry.get("replied_at"),
                created_at=inquiry["created_at"],
                updated_at=inquiry["updated_at"]
            ))

        return InquiryListResponse(inquiries=inquiries_list, total=len(inquiries_list))

    except Exception as e:
        import traceback
        print(f"[ERROR] 문의 목록 조회 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문의 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/{inquiry_id}/reply", response_model=MessageResponse)
async def reply_inquiry(
    inquiry_id: str,
    reply_data: InquiryReplyRequest,
    current_admin: dict = Depends(get_current_admin)
):
    """문의 답변 등록 (관리자용)"""
    supabase_admin = get_supabase_admin_client()

    try:
        update_data = {
            "admin_reply": reply_data.admin_reply,
            "admin_id": current_admin["id"],
            "status": "answered",
            "replied_at": datetime.utcnow().isoformat()
        }

        response = supabase_admin.table("inquiries").update(update_data).eq("id", inquiry_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="문의를 찾을 수 없습니다."
            )

        return MessageResponse(message="답변이 등록되었습니다.")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] 문의 답변 오류: {str(e)}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"답변 등록 중 오류가 발생했습니다: {str(e)}"
        )
