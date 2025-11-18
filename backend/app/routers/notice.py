from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.services.supabase import get_supabase_admin_client
from app.services.auth_middleware import get_current_admin

router = APIRouter(prefix="/notices", tags=["Notices"])


class NoticeCreate(BaseModel):
    """공지사항 생성 요청"""
    title: str
    content: str
    is_important: bool = False


class NoticeUpdate(BaseModel):
    """공지사항 수정 요청"""
    title: Optional[str] = None
    content: Optional[str] = None
    is_important: Optional[bool] = None


class NoticeResponse(BaseModel):
    """공지사항 응답"""
    id: str
    title: str
    content: str
    is_important: bool
    views: int
    created_at: str
    updated_at: str
    author_name: str


@router.get("", response_model=List[NoticeResponse])
async def get_notices(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None
):
    """공지사항 목록 조회"""
    supabase = get_supabase_admin_client()

    try:
        # 공지사항 조회 (admin_users 조인)
        query = supabase.table("notices").select(
            "*, admin_users(full_name)"
        ).order("is_important", desc=True).order("created_at", desc=True)

        if search:
            query = query.or_(f"title.ilike.%{search}%,content.ilike.%{search}%")

        query = query.range(skip, skip + limit - 1)
        response = query.execute()

        notices = []
        for notice in response.data:
            notices.append(NoticeResponse(
                id=notice["id"],
                title=notice["title"],
                content=notice["content"],
                is_important=notice["is_important"],
                views=notice["views"],
                created_at=notice["created_at"],
                updated_at=notice["updated_at"],
                author_name=notice["admin_users"]["full_name"] if notice.get("admin_users") else "관리자"
            ))

        return notices

    except Exception as e:
        print(f"[ERROR] 공지사항 목록 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공지사항 목록 조회 중 오류가 발생했습니다."
        )


@router.get("/{notice_id}", response_model=NoticeResponse)
async def get_notice(notice_id: str):
    """공지사항 상세 조회"""
    supabase = get_supabase_admin_client()

    try:
        # 조회수 증가
        supabase.rpc("increment_notice_views", {"notice_id": notice_id}).execute()

        # 공지사항 조회
        response = supabase.table("notices").select(
            "*, admin_users(full_name)"
        ).eq("id", notice_id).single().execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="공지사항을 찾을 수 없습니다."
            )

        notice = response.data
        return NoticeResponse(
            id=notice["id"],
            title=notice["title"],
            content=notice["content"],
            is_important=notice["is_important"],
            views=notice["views"],
            created_at=notice["created_at"],
            updated_at=notice["updated_at"],
            author_name=notice["admin_users"]["full_name"] if notice.get("admin_users") else "관리자"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 공지사항 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공지사항 조회 중 오류가 발생했습니다."
        )


@router.post("", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
async def create_notice(
    notice_data: NoticeCreate,
    admin: dict = Depends(get_current_admin)
):
    """공지사항 생성 (관리자 전용)"""
    supabase = get_supabase_admin_client()

    try:
        # 공지사항 생성
        response = supabase.table("notices").insert({
            "title": notice_data.title,
            "content": notice_data.content,
            "is_important": notice_data.is_important,
            "author_id": admin["id"],
            "views": 0
        }).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="공지사항 생성에 실패했습니다."
            )

        notice = response.data[0]

        return NoticeResponse(
            id=notice["id"],
            title=notice["title"],
            content=notice["content"],
            is_important=notice["is_important"],
            views=notice["views"],
            created_at=notice["created_at"],
            updated_at=notice["updated_at"],
            author_name=admin["full_name"]
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 공지사항 생성 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공지사항 생성 중 오류가 발생했습니다."
        )


@router.put("/{notice_id}", response_model=NoticeResponse)
async def update_notice(
    notice_id: str,
    notice_data: NoticeUpdate,
    admin: dict = Depends(get_current_admin)
):
    """공지사항 수정 (관리자 전용)"""
    supabase = get_supabase_admin_client()

    try:
        # 공지사항 존재 확인
        existing = supabase.table("notices").select("*").eq("id", notice_id).single().execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="공지사항을 찾을 수 없습니다."
            )

        # 업데이트할 데이터 준비
        update_data = {}
        if notice_data.title is not None:
            update_data["title"] = notice_data.title
        if notice_data.content is not None:
            update_data["content"] = notice_data.content
        if notice_data.is_important is not None:
            update_data["is_important"] = notice_data.is_important

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="수정할 내용이 없습니다."
            )

        # 공지사항 수정
        response = supabase.table("notices").update(update_data).eq("id", notice_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="공지사항 수정에 실패했습니다."
            )

        notice = response.data[0]

        return NoticeResponse(
            id=notice["id"],
            title=notice["title"],
            content=notice["content"],
            is_important=notice["is_important"],
            views=notice["views"],
            created_at=notice["created_at"],
            updated_at=notice["updated_at"],
            author_name=admin["full_name"]
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 공지사항 수정 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공지사항 수정 중 오류가 발생했습니다."
        )


@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notice(
    notice_id: str,
    admin: dict = Depends(get_current_admin)
):
    """공지사항 삭제 (관리자 전용)"""
    supabase = get_supabase_admin_client()

    try:
        # 공지사항 존재 확인
        existing = supabase.table("notices").select("id").eq("id", notice_id).single().execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="공지사항을 찾을 수 없습니다."
            )

        # 공지사항 삭제
        supabase.table("notices").delete().eq("id", notice_id).execute()

        return None

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 공지사항 삭제 실패: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공지사항 삭제 중 오류가 발생했습니다."
        )
