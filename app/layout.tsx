import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans_KR({
  variable: "--font-plex-sans",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

// ponytail: <html lang>은 en으로 고정하고 실제 언어는 app/[locale]/layout.tsx의
// 래퍼 요소 lang으로 지정한다. 정적 export에서 루트 레이아웃은 자식 세그먼트의
// params를 볼 수 없다. 검색엔진 쪽은 locale 레이아웃의 hreflang alternates로
// 처리하고, 언어별 도메인으로 갈라질 때 분리하면 된다.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
