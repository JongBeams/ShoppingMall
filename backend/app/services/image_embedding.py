"""
이미지 임베딩 생성 서비스 (CLIP 모델)
"""

from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image, ImageEnhance
import requests
from io import BytesIO
from typing import List
import os
import numpy as np

class ImageEmbeddingService:
    """CLIP 모델을 사용한 이미지 임베딩 생성"""

    def __init__(self):
        """CLIP 모델 초기화"""
        # 🔥 기존 모델 유지 (ViT-B/32) - DB에 저장된 임베딩과 호환
        model_name = "openai/clip-vit-base-patch32"

        print(f"[ImageEmbedding] Loading CLIP model: {model_name}")
        self.model = CLIPModel.from_pretrained(model_name)
        self.processor = CLIPProcessor.from_pretrained(model_name)

        # GPU 사용 가능하면 GPU로, 아니면 CPU
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        self.model.eval()  # 추론 모드

        print(f"[ImageEmbedding] Model loaded on {self.device}")

    def generate_embedding(self, image_url: str) -> List[float]:
        """
        이미지 URL로부터 임베딩 벡터 생성

        Args:
            image_url: 이미지 URL (Supabase Storage URL)

        Returns:
            512차원 float 리스트
        """
        try:
            # 이미지 다운로드
            if image_url.startswith("http"):
                response = requests.get(image_url, timeout=10)
                image = Image.open(BytesIO(response.content)).convert("RGB")
            else:
                # 로컬 파일 경로
                image = Image.open(image_url).convert("RGB")

            # CLIP 전처리 및 임베딩 생성
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                # 정규화 (코사인 유사도 계산 위해)
                image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)

            # CPU로 이동 후 리스트로 변환
            embedding = image_features.cpu().numpy().flatten().tolist()

            print(f"[ImageEmbedding] Generated embedding for {image_url[:50]}... (dim={len(embedding)})")
            return embedding

        except Exception as e:
            print(f"[ImageEmbedding] Error generating embedding: {e}")
            raise e

    def generate_embedding_from_bytes(self, image_bytes: bytes) -> List[float]:
        """
        이미지 바이트 데이터로부터 임베딩 생성

        Args:
            image_bytes: 이미지 바이트 데이터

        Returns:
            512차원 float 리스트
        """
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")

            # 이미지 전처리
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                # L2 정규화 (코사인 유사도를 위해 필수)
                image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)

            embedding = image_features.cpu().numpy().flatten().tolist()

            print(f"[ImageEmbedding] Generated embedding from bytes (dim={len(embedding)})")
            return embedding

        except Exception as e:
            print(f"[ImageEmbedding] Error generating embedding from bytes: {e}")
            raise e


# 싱글톤 인스턴스 (모델 한 번만 로드)
_image_embedding_service = None

def get_image_embedding_service() -> ImageEmbeddingService:
    """이미지 임베딩 서비스 싱글톤 인스턴스 반환"""
    global _image_embedding_service

    if _image_embedding_service is None:
        _image_embedding_service = ImageEmbeddingService()

    return _image_embedding_service
