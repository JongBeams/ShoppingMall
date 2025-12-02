'use client';

import { usePathname } from 'next/navigation';
import Header from './common/Header';
import Footer from './common/Footer';
import AIChatButton from './common/AIChatButton';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 결제 관련 페이지는 헤더/푸터 숨김
  const hideLayout = pathname?.startsWith('/order/checkout') ||
                     pathname?.startsWith('/order/success') ||
                     pathname?.startsWith('/order/fail') ||
                     pathname?.startsWith('/subscription/checkout') ||
                     pathname?.startsWith('/subscription/success') ||
                     pathname?.startsWith('/subscription/fail');

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex flex-col">
        <div className="mx-auto max-w-7xl w-full p-8 flex-1">
          {children}
        </div>
        <Footer />
      </main>
      <AIChatButton />
    </>
  );
}
