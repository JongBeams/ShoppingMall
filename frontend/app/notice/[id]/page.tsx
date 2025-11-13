'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Notice {
  id: number;
  title: string;
  date: string;
  category: string;
  content: string;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // 실제로는 API에서 가져와야 하지만, 현재는 더미 데이터 사용
  const notices: Notice[] = [
    {
      id: 1,
      title: '2025년 설날 배송 및 고객센터 운영 안내',
      date: '2025.01.20',
      category: '배송',
      content: `
        <h2>설날 연휴 배송 안내</h2>
        <p>2025년 설날 연휴 기간 동안 배송 및 고객센터 운영 일정을 안내드립니다.</p>

        <h3>배송 일정</h3>
        <ul>
          <li><strong>1월 27일(월) ~ 1월 30일(목)</strong>: 배송 정상 운영</li>
          <li><strong>1월 31일(금) ~ 2월 2일(일)</strong>: 배송 휴무</li>
          <li><strong>2월 3일(월)부터</strong>: 배송 정상 운영</li>
        </ul>

        <h3>고객센터 운영 시간</h3>
        <ul>
          <li><strong>1월 27일(월) ~ 1월 30일(목)</strong>: 오전 9시 ~ 오후 6시</li>
          <li><strong>1월 31일(금) ~ 2월 2일(일)</strong>: 휴무</li>
          <li><strong>2월 3일(월)부터</strong>: 정상 운영 (오전 9시 ~ 오후 6시)</li>
        </ul>

        <p>연휴 기간 중 불편을 드려 죄송합니다. 즐거운 설 명절 보내시기 바랍니다.</p>
      `,
    },
    {
      id: 2,
      title: '개인정보 처리방침 변경 안내',
      date: '2025.01.15',
      category: '정책',
      content: `
        <h2>개인정보 처리방침 변경 안내</h2>
        <p>고객님의 개인정보 보호를 위해 개인정보 처리방침이 다음과 같이 변경됩니다.</p>

        <h3>주요 변경 사항</h3>
        <ul>
          <li>개인정보 보유 및 이용기간 명시</li>
          <li>제3자 제공 항목 및 목적 구체화</li>
          <li>개인정보 파기 절차 및 방법 상세화</li>
          <li>개인정보 처리 위탁 업체 정보 업데이트</li>
        </ul>

        <h3>시행일</h3>
        <p>변경된 개인정보 처리방침은 <strong>2025년 2월 1일</strong>부터 시행됩니다.</p>

        <p>자세한 내용은 하단의 개인정보 처리방침 페이지에서 확인하실 수 있습니다.</p>
      `,
    },
    {
      id: 3,
      title: '신규 결제 수단 추가 안내',
      date: '2025.01.10',
      category: '서비스',
      content: `
        <h2>신규 결제 수단 추가</h2>
        <p>더욱 편리한 쇼핑을 위해 다양한 결제 수단을 추가했습니다.</p>

        <h3>추가된 결제 수단</h3>
        <ul>
          <li><strong>카카오페이</strong>: 간편하고 빠른 결제</li>
          <li><strong>네이버페이</strong>: 포인트 적립 및 사용 가능</li>
          <li><strong>토스페이</strong>: 송금부터 결제까지 한번에</li>
          <li><strong>PAYCO</strong>: NFC 간편결제 지원</li>
        </ul>

        <h3>혜택</h3>
        <p>신규 결제 수단 이용 시 <strong>첫 결제 5% 할인</strong> 혜택을 드립니다!</p>
        <p>할인 기간: 2025년 1월 10일 ~ 2월 28일</p>
      `,
    },
    {
      id: 4,
      title: '회원 등급제 도입 안내',
      date: '2025.01.05',
      category: '이벤트',
      content: `
        <h2>회원 등급제 도입</h2>
        <p>고객님의 충성도에 보답하기 위해 회원 등급제를 도입합니다.</p>

        <h3>등급별 혜택</h3>
        <ul>
          <li><strong>VIP 등급</strong>: 최대 10% 할인 + 무료배송 + 전용 쿠폰</li>
          <li><strong>GOLD 등급</strong>: 최대 7% 할인 + 3만원 이상 무료배송</li>
          <li><strong>SILVER 등급</strong>: 최대 5% 할인 + 5만원 이상 무료배송</li>
          <li><strong>일반 등급</strong>: 최대 3% 할인</li>
        </ul>

        <h3>등급 산정 기준</h3>
        <p>최근 6개월간 구매 금액 및 구매 횟수를 기준으로 산정됩니다.</p>

        <h3>시행일</h3>
        <p>2025년 2월 1일부터 시행됩니다.</p>
      `,
    },
    {
      id: 5,
      title: '시스템 점검 안내',
      date: '2024.12.28',
      category: '시스템',
      content: `
        <h2>정기 시스템 점검 안내</h2>
        <p>안정적인 서비스 제공을 위해 시스템 점검을 실시합니다.</p>

        <h3>점검 일시</h3>
        <p><strong>2025년 1월 1일(수) 오전 2시 ~ 오전 6시 (약 4시간)</strong></p>

        <h3>점검 내용</h3>
        <ul>
          <li>서버 인프라 업그레이드</li>
          <li>데이터베이스 최적화</li>
          <li>보안 패치 적용</li>
          <li>성능 개선 작업</li>
        </ul>

        <h3>서비스 이용 제한</h3>
        <p>점검 시간 동안 모든 서비스 이용이 일시 중단됩니다.</p>
        <p>고객님의 양해 부탁드립니다.</p>
      `,
    },
  ];

  const notice = notices.find((n) => n.id === parseInt(id));

  if (!notice) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              공지사항을 찾을 수 없습니다
            </h1>
            <Link
              href="/notice"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/notice"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          목록으로
        </Link>

        {/* Notice Header */}
        <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
          <div className="mb-3 flex items-center gap-2">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
              notice.category === '배송' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              notice.category === '정책' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
              notice.category === '서비스' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              notice.category === '이벤트' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {notice.category}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{notice.date}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {notice.title}
          </h1>
        </div>

        {/* Notice Content */}
        <div
          className="prose prose-lg max-w-none dark:prose-invert
            prose-headings:text-gray-900 dark:prose-headings:text-white
            prose-p:text-gray-700 dark:prose-p:text-gray-300
            prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-ul:text-gray-700 dark:prose-ul:text-gray-300
            prose-li:text-gray-700 dark:prose-li:text-gray-300"
          dangerouslySetInnerHTML={{ __html: notice.content }}
        />
      </div>
    </div>
  );
}