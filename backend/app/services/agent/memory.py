"""
대화 상태 저장소 — LangGraph 체크포인터 (thread_id 단위)

- AGENT_CHECKPOINT_DB (PostgreSQL 연결 문자열)가 있으면 PostgresSaver:
  서버를 재시작하거나 워커가 여러 개여도 같은 대화를 이어 가고, 확인 대기 중인 실행도 그대로 남습니다.
  Supabase 를 쓰는 운영 환경에서는 같은 프로젝트의 Postgres 연결 문자열을 넣습니다.
- 없으면 프로세스 메모리 (테스트 · 단일 개발 서버).
"""
import logging
import os

from langgraph.checkpoint.memory import InMemorySaver

logger = logging.getLogger(__name__)

_saver = None
_pool = None


def get_checkpointer():
    global _saver, _pool
    if _saver is not None:
        return _saver
    url = os.getenv("AGENT_CHECKPOINT_DB")
    if url:
        from langgraph.checkpoint.postgres import PostgresSaver
        from psycopg_pool import ConnectionPool
        _pool = ConnectionPool(url, kwargs={"autocommit": True, "prepare_threshold": 0},
                               min_size=1, max_size=4, open=True)
        _saver = PostgresSaver(_pool)
        _saver.setup()  # 체크포인트 테이블이 없으면 만듦
        logger.info("[agent.memory] PostgresSaver")
    else:
        _saver = InMemorySaver()
        logger.info("[agent.memory] InMemorySaver (AGENT_CHECKPOINT_DB 없음)")
    return _saver


def close_checkpointer():
    global _saver, _pool
    if _pool is not None:
        _pool.close()
    _saver, _pool = None, None
