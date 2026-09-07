import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '새벽선 · BLUE HOUR',
  description:
    '비가 그치기 전, 누구와 함께 캠퍼스를 나갈 것인가. 당신의 선택과 동료가 세 갈래의 탈출을 바꾸는 생존 어드벤처.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
