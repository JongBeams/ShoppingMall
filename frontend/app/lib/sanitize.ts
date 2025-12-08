/**
 * XSS 공격 방어를 위한 HTML 이스케이프 함수
 * DOMPurify 대신 기본 이스케이프 사용 (의존성 추가 없이)
 */

const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * HTML 특수문자를 이스케이프하여 XSS 공격 방어
 * @param text - 사용자 입력 텍스트
 * @returns 이스케이프된 안전한 텍스트
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * URL이 안전한지 검증 (javascript:, data:, vbscript: 등 차단)
 * @param url - 검증할 URL
 * @returns 안전하면 true
 */
export function isSafeUrl(url: string): boolean {
  const dangerousProtocols = /^(javascript|data|vbscript):/i;
  return !dangerousProtocols.test(url.trim());
}

/**
 * 채팅 메시지를 안전하게 렌더링하기 위한 sanitize
 * - HTML 태그 제거
 * - 특수문자 이스케이프
 * - 줄바꿈 보존
 */
export function sanitizeChatMessage(message: string): string {
  // 1. HTML 태그 제거
  const withoutTags = message.replace(/<[^>]*>/g, '');

  // 2. 특수문자 이스케이프
  const escaped = escapeHtml(withoutTags);

  return escaped;
}
