"use client";

import Link from "next/link";
import { useState } from "react";
import { consentStore, type ConsentState } from "@/lib/lab-state";
import { pushDL } from "@/lib/tracking";
import { useHydrated } from "@/lib/hooks";

const g = (b: boolean) => (b ? "granted" : "denied") as "granted" | "denied";

export function ConsentBanner() {
  const hydrated = useHydrated();
  const consent = consentStore.useStore();
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const [personal, setPersonal] = useState(false);

  // Chỉ hiện sau hydrate → không nháy banner với người đã chọn
  if (!hydrated || consent.decided) return null;

  function apply(state: ConsentState) {
    // Consent Mode v2: gtag('consent','update',...) → GTM tự điều chỉnh hành vi các tag Google
    window.gtag("consent", "update", state);
    // Thêm 1 custom event để bạn có thể dùng làm trigger cho tag không phải của Google
    pushDL({ event: "consent_update", consent_state: state });
    consentStore.set({ decided: true, state });
  }

  return (
    <div
      role="dialog"
      aria-label="Đồng ý cookie"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
    >
      {/* pb/pr chừa chỗ cho nút dataLayer nổi ở góc phải */}
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-4 pb-16 md:flex-row md:items-end md:pr-44 md:pb-4">
        <div className="flex-1">
          <p className="font-semibold">Bạn có đồng ý cho dùng cookie thống kê &amp; quảng cáo?</p>
          <p className="mt-1 text-sm text-muted">
            Nếu đồng ý, Google Analytics và Google Ads (do Google cung cấp, máy chủ đặt ngoài Việt Nam) sẽ ghi nhận lượt xem trang,
            nguồn quảng cáo và thao tác của bạn để thống kê, đo lường và cá nhân hoá quảng cáo. Từ chối không ảnh hưởng việc dùng
            website; bạn có thể đổi ý bất kỳ lúc nào ở chân trang. Chi tiết:{" "}
            <Link href="/privacy" className="underline">Chính sách bảo mật</Link> ·{" "}
            <Link href="/cookies" className="underline">Chính sách cookie</Link>.
          </p>
          <p className="mt-1 text-xs text-muted">
            Lab: lựa chọn được gửi bằng <code className="font-mono">gtag(&apos;consent&apos;,&apos;update&apos;)</code> (Consent Mode v2).
          </p>
          {custom && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                Thống kê <span className="font-mono text-xs text-muted">analytics_storage</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} />
                Đo lường quảng cáo <span className="font-mono text-xs text-muted">ad_storage + ad_user_data</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={personal} onChange={(e) => setPersonal(e.target.checked)} />
                Quảng cáo cá nhân hoá <span className="font-mono text-xs text-muted">ad_personalization</span>
              </label>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {custom ? (
            <button
              className="btn-ghost"
              onClick={() =>
                apply({
                  analytics_storage: g(analytics),
                  ad_storage: g(ads),
                  ad_user_data: g(ads),
                  ad_personalization: g(personal),
                })
              }
            >
              Lưu lựa chọn
            </button>
          ) : (
            <button className="btn-ghost" onClick={() => setCustom(true)}>
              Tuỳ chỉnh
            </button>
          )}
          <button
            className="btn-ghost"
            onClick={() =>
              apply({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" })
            }
          >
            Từ chối tất cả
          </button>
          <button
            className="btn-primary"
            onClick={() =>
              apply({ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" })
            }
          >
            Chấp nhận tất cả
          </button>
        </div>
      </div>
    </div>
  );
}
