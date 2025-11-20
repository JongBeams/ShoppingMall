"""
문서 관리 API (PDF 업로드, 임베딩, pgvector 저장)
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List, Optional
from datetime import datetime
import os
import uuid
from pathlib import Path
from pydantic import BaseModel

from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer
from app.services.supabase import supabase
from app.services.rag_search import rag_search

router = APIRouter(prefix="/documents", tags=["documents"])


# 검색 요청 모델
class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 3
    use_ollama: Optional[bool] = True

# 임베딩 모델 초기화 (전역 변수로 한 번만 로드)
embedding_model = None

def get_embedding_model():
    global embedding_model
    if embedding_model is None:
        print("Loading embedding model: BAAI/bge-m3...")
        embedding_model = SentenceTransformer('BAAI/bge-m3')
    return embedding_model

# PDF 저장 디렉토리
UPLOAD_DIR = Path("./uploaded_pdfs")
UPLOAD_DIR.mkdir(exist_ok=True)


def extract_text_from_pdf(file_path: str) -> str:
    """PDF에서 텍스트 추출"""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF 텍스트 추출 실패: {str(e)}")


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """텍스트를 청크로 분할"""
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]

        # 마지막 청크가 아니면 문장 단위로 자르기
        if end < text_length:
            # 마지막 마침표, 줄바꿈 찾기
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            cut_point = max(last_period, last_newline)

            if cut_point > chunk_size * 0.5:  # 너무 작게 잘리지 않도록
                chunk = chunk[:cut_point + 1]
                end = start + cut_point + 1

        chunks.append(chunk.strip())
        start = end - overlap

    return [c for c in chunks if len(c) > 20]  # 너무 짧은 청크 제외


def embed_chunks(chunks: List[str]) -> List[List[float]]:
    """청크들을 벡터로 임베딩"""
    model = get_embedding_model()
    embeddings = model.encode(chunks, normalize_embeddings=True, show_progress_bar=False)
    return [emb.tolist() for emb in embeddings]


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    PDF 파일 업로드 및 임베딩
    1. PDF 파일 저장
    2. 텍스트 추출
    3. 청크 분할
    4. 임베딩
    5. Supabase pgvector에 저장
    """
    # 파일 검증
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다.")

    if file.size and file.size > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(status_code=400, detail="파일 크기는 50MB 이하여야 합니다.")

    try:
        # 고유 ID 생성
        doc_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{doc_id}.pdf"

        # 1. 파일 저장
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # 2. 텍스트 추출
        text = extract_text_from_pdf(str(file_path))

        if not text or len(text) < 50:
            raise HTTPException(status_code=400, detail="PDF에서 텍스트를 추출할 수 없습니다.")

        # 3. 청크 분할
        chunks = chunk_text(text)

        # 4. 임베딩
        embeddings = embed_chunks(chunks)

        # 5. Supabase에 문서 정보 저장
        doc_data = {
            'id': doc_id,
            'filename': file.filename,
            'file_size': len(content),
            'file_path': str(file_path),
            'chunk_count': len(chunks),
            'status': 'processing',
            'uploaded_at': datetime.utcnow().isoformat()
        }

        # documents 테이블에 저장
        supabase.table('documents').insert(doc_data).execute()

        # 6. pgvector 테이블에 청크 + 임베딩 저장
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_data = {
                'document_id': doc_id,
                'chunk_index': i,
                'content': chunk,
                'embedding': embedding,
                'created_at': datetime.utcnow().isoformat()
            }
            supabase.table('document_chunks').insert(chunk_data).execute()

        # 7. 문서 상태를 'completed'로 업데이트
        supabase.table('documents').update({
            'status': 'completed'
        }).eq('id', doc_id).execute()

        return {
            "message": "업로드 성공",
            "document_id": doc_id,
            "filename": file.filename,
            "chunk_count": len(chunks)
        }

    except HTTPException:
        raise
    except Exception as e:
        # 실패 시 문서 상태 업데이트
        if 'doc_id' in locals():
            supabase.table('documents').update({
                'status': 'failed'
            }).eq('id', doc_id).execute()

        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"업로드 중 오류 발생: {str(e)}")


@router.get("")
async def get_documents():
    """업로드된 문서 목록 조회"""
    try:
        result = supabase.table('documents').select('*').order('uploaded_at', desc=True).execute()
        return {"documents": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"문서 목록 조회 실패: {str(e)}")


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """문서 삭제 (파일, DB 레코드, 청크)"""
    try:
        # 1. 문서 정보 조회
        doc_result = supabase.table('documents').select('*').eq('id', document_id).execute()

        if not doc_result.data:
            raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

        doc = doc_result.data[0]

        # 2. 파일 삭제
        file_path = Path(doc['file_path'])
        if file_path.exists():
            file_path.unlink()

        # 3. 청크 삭제
        supabase.table('document_chunks').delete().eq('document_id', document_id).execute()

        # 4. 문서 삭제
        supabase.table('documents').delete().eq('id', document_id).execute()

        return {"message": "문서가 삭제되었습니다."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"문서 삭제 실패: {str(e)}")


@router.post("/search")
async def search_documents_api(request: SearchRequest):
    """
    RAG 검색 API
    - 질문을 임베딩
    - pgvector로 유사 문서 검색
    - Ollama로 답변 생성
    """
    try:
        result = rag_search(
            query=request.query,
            search_limit=request.limit,
            use_ollama=request.use_ollama
        )
        return result

    except Exception as e:
        print(f"Search error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"검색 중 오류 발생: {str(e)}")
