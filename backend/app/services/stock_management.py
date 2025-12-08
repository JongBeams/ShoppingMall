"""
재고 관리 서비스 (동시성 제어)
"""

from typing import Dict, Tuple
from app.services.supabase import get_supabase_admin_client
import logging



logger = logging.getLogger(__name__)

async def decrement_stock(product_id: str, quantity: int) -> Tuple[bool, str, int]:
    """
    재고 감소 (Row-Level Lock으로 동시성 제어)

    Args:
        product_id: 상품 ID
        quantity: 차감할 수량

    Returns:
        (성공 여부, 메시지, 남은 재고)
    """
    supabase = get_supabase_admin_client()

    try:
        # Supabase RPC 함수 호출 (PostgreSQL Row-Level Lock)
        result = supabase.rpc(
            'decrement_stock_with_lock',
            {
                'p_product_id': product_id,
                'p_quantity': quantity
            }
        ).execute()

        if not result.data or len(result.data) == 0:
            return False, "재고 차감 실패", 0

        data = result.data[0]
        return data['success'], data['message'], data['remaining_stock']

    except Exception as e:
        logger.error(f"재고 차감 오류: {str(e)}")
        return False, f"재고 차감 중 오류 발생: {str(e)}", 0


async def restore_stock(product_id: str, quantity: int) -> Tuple[bool, str, int]:
    """
    재고 복구 (주문 취소 시)

    Args:
        product_id: 상품 ID
        quantity: 복구할 수량

    Returns:
        (성공 여부, 메시지, 남은 재고)
    """
    supabase = get_supabase_admin_client()

    try:
        result = supabase.rpc(
            'restore_stock',
            {
                'p_product_id': product_id,
                'p_quantity': quantity
            }
        ).execute()

        if not result.data or len(result.data) == 0:
            return False, "재고 복구 실패", 0

        data = result.data[0]
        return data['success'], data['message'], data['remaining_stock']

    except Exception as e:
        logger.info(f"[ERROR] 재고 복구 오류: {str(e)}")
        return False, f"재고 복구 중 오류 발생: {str(e)}", 0


async def check_stock_availability(product_id: str, quantity: int) -> Dict:
    """
    재고 확인 (락 없이)

    Args:
        product_id: 상품 ID
        quantity: 확인할 수량

    Returns:
        {
            'available': bool,
            'current_stock': int,
            'message': str
        }
    """
    supabase = get_supabase_admin_client()

    try:
        result = supabase.table('products')\
            .select('stock, name')\
            .eq('id', product_id)\
            .single()\
            .execute()

        if not result.data:
            return {
                'available': False,
                'current_stock': 0,
                'message': '상품을 찾을 수 없습니다.'
            }

        current_stock = result.data['stock']
        product_name = result.data['name']

        if current_stock < quantity:
            return {
                'available': False,
                'current_stock': current_stock,
                'message': f'{product_name}의 재고가 부족합니다. (요청: {quantity}개, 재고: {current_stock}개)'
            }

        return {
            'available': True,
            'current_stock': current_stock,
            'message': '재고가 충분합니다.'
        }

    except Exception as e:
        logger.info(f"[ERROR] 재고 확인 오류: {str(e)}")
        return {
            'available': False,
            'current_stock': 0,
            'message': f'재고 확인 중 오류 발생: {str(e)}'
        }
