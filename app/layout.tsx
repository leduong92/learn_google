import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LabBar } from "@/components/LabBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DebugPanel } from "@/components/DebugPanel";
import { ConsentBanner } from "@/components/ConsentBanner";
import { DemoNotice } from "@/components/DemoNotice";
import { SITE } from "@/lib/site-config";

const GTM_ID = process.env.NEXT_GTM_ID;

const sans = Be_Vietnam_Pro({
  variable: "--font-sans-vn",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-vn",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${SITE.brand} (demo) — GTM & Google Ads Lab`,
  description:
    "Website DEMO, không bán hàng: cửa hàng giả lập để học Google Tag Manager, GA4 ecommerce và Google Ads conversion tracking.",
  // Cửa hàng giả không nên được index → tránh người dùng tưởng là shop thật
  robots: SITE.noindex ? { index: false, follow: false } : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        {/*
          TODO Bài 1 — Nhúng Google Tag Manager
          Dán đoạn code GTM (lấy từ GTM → Admin → Install Google Tag Manager) vào đây.
          Gợi ý: trong JSX, thẻ <script> có nội dung phải viết dạng
            <script dangerouslySetInnerHTML={{ __html: `...code...` }} />
          Xem hướng dẫn chi tiết ở trang /lab/guide.

          TODO Bài 7 — Consent Mode: đặt gtag('consent','default', …) TRƯỚC đoạn code GTM.
        */}
        {GTM_ID && (
          <>
            {/* (1) Tạo dataLayer + hàm gtag — phải chạy TRƯỚC khi GTM tải */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // Mặc định: TỪ CHỐI hết, cho tới khi người dùng chọn
            gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
            });

            // Người dùng đã chọn ở lần truy cập trước? → áp dụng lại ngay
            try {
            var c = JSON.parse(localStorage.getItem('lab_consent_ui') || 'null');
            if (c && c.decided) gtag('consent', 'update', c.state);
            } catch (e) {}

            gtag('js', new Date());
          `,
              }}
            />
            {/* (2) Tải container GTM */}
            <script
              async
              src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <DemoNotice />
        <LabBar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ConsentBanner />
        <DebugPanel />
      </body>
    </html>
  );
}
