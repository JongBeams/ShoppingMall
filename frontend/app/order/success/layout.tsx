import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '결제 완료',
  description: '결제가 완료되었습니다',
  icons: {
    icon: 'https://static.toss.im/icons/png/4x/icon-toss-logo.png',
  },
};

export default function SuccessLayout({
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
