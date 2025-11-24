import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '결제하기',
  description: '토스페이먼츠 결제',
  icons: {
    icon: 'https://static.toss.im/icons/png/4x/icon-toss-logo.png',
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ margin: 0, padding: 0 }}>
      {children}
    </div>
  );
}
