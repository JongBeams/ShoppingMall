import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '결제 실패',
  description: '결제에 실패했습니다',
  icons: {
    icon: 'https://static.toss.im/icons/png/4x/icon-toss-logo.png',
  },
};

export default function FailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
      {children}
    </div>
  );
}
