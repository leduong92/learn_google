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
  description: "Website DEMO, không bán hàng: cửa hàng giả lập để học Google Tag Manager, GA4 ecommerce và Google Ads conversion tracking.",
  // Cửa hàng giả không nên được index → tránh người dùng tưởng là shop thật
  robots: SITE.noindex ? { index: false, follow: false } : undefined,
};

const ENV_GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";

/**
 * Snippet chạy đồng bộ trong <head>, TRƯỚC mọi JS khác:
 *  1. Khởi tạo dataLayer + hàm gtag()
 *  2. "Bọc" dataLayer.push để Debug Panel thấy mọi event (GTM sẽ bọc tiếp lên trên, không ảnh hưởng)
 *  3. Consent Mode v2: mặc định denied, rồi update nếu người dùng đã chọn trước đó
 *  4. Chèn GTM container (ID lấy từ trang Cài đặt Lab, hoặc NEXT_PUBLIC_GTM_ID)
 */
const bootstrap = `
(function(){
  window.dataLayer = window.dataLayer || [];
  window.__dlLog = window.__dlLog || [];
  var dl = window.dataLayer;
  var basePush = dl.push;
  dl.push = function(){
    for (var i = 0; i < arguments.length; i++) {
      var e = arguments[i];
      var data = Object.prototype.toString.call(e) === '[object Arguments]' ? { gtag: Array.prototype.slice.call(e) } : e;
      var entry = { t: Date.now(), data: JSON.parse(JSON.stringify(data === undefined ? null : data)) };
      window.__dlLog.push(entry);
      try { window.dispatchEvent(new CustomEvent('lab:dl', { detail: entry })); } catch (_) {}
    }
    return basePush.apply(dl, arguments);
  };
  window.gtag = function(){ dl.push(arguments); };

  var settings = {}, consent = null;
  try { settings = JSON.parse(localStorage.getItem('lab_settings') || '{}'); } catch (_) {}
  try { consent = JSON.parse(localStorage.getItem('lab_consent_ui') || 'null'); } catch (_) {}

  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);
  if (consent && consent.decided) gtag('consent', 'update', consent.state);

  var id = (settings.gtmId || ${JSON.stringify(ENV_GTM_ID)} || '').trim().toUpperCase();
  window.__labGtmId = id;
  if (/^GTM-[A-Z0-9]+$/.test(id)) {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',id);
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <head>
        <script id="lab-gtm-bootstrap" dangerouslySetInnerHTML={{ __html: bootstrap }} />
      </head>
      <body className="min-h-full flex flex-col">
        {ENV_GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${ENV_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
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
