"use client";

import Link from "next/link";
import { useState } from "react";
import { bumpStat, consentStore } from "@/lib/lab-state";
import { currentChannel, pushDL, sha256 } from "@/lib/tracking";
import { SITE } from "@/lib/site-config";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;
    const normalized = email.trim().toLowerCase();
    // Chỉ đính kèm email (dạng băm) khi người dùng đã cho phép ad_user_data
    const canShare = consentStore.get().state.ad_user_data === "granted";
    // generate_lead: chuyển đổi phụ (secondary conversion) trong Google Ads
    pushDL({
      event: "generate_lead",
      lead_source: "footer_newsletter",
      value: 50_000, // giá trị ước tính của 1 lead
      currency: "VND",
      ...(canShare ? { user_data_sha256: { sha256_email_address: await sha256(normalized) } } : {}),
    });
    bumpStat(currentChannel(), "leads");
    setDone(true);
  }

  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <p className="font-semibold">{SITE.brand} — website demo</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Không bán hàng, không giao hàng, không thu tiền. Mọi hành động chỉ đẩy sự kiện vào{" "}
            <code className="font-mono">dataLayer</code> để luyện GTM, GA4 và Google Ads.
          </p>
          <p className="mt-2 text-sm text-muted">
            Vận hành bởi {SITE.operatorName} · {SITE.contactEmail}
          </p>
          <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/privacy" className="text-accent underline underline-offset-2">Chính sách bảo mật</Link>
            <Link href="/cookies" className="text-accent underline underline-offset-2">Chính sách cookie</Link>
            <Link href="/terms" className="text-accent underline underline-offset-2">Điều khoản sử dụng</Link>
            <button
              type="button"
              className="text-accent underline underline-offset-2"
              onClick={() => consentStore.set((p) => ({ ...p, decided: false }))}
            >
              Cài đặt cookie
            </button>
          </nav>
        </div>
        <form onSubmit={onSubmit} className="md:justify-self-end">
          <label htmlFor="nl-email" className="label">
            Thử form đăng ký (bắn sự kiện <code className="font-mono">generate_lead</code>)
          </label>
          {done ? (
            <p className="text-sm text-accent">Đã ghi nhận event. Mở Debug panel để xem.</p>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  id="nl-email"
                  type="email"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  className="field w-64"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn-primary" disabled={!agree}>Gửi</button>
              </div>
              <label className="mt-2 flex max-w-sm gap-2 text-xs text-muted">
                <input type="checkbox" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
                <span>
                  Tôi hiểu đây là demo: email không được lưu trên máy chủ, sẽ không có email nào được gửi. Tôi đã đọc{" "}
                  <Link href="/privacy" className="underline">Chính sách bảo mật</Link>.
                </span>
              </label>
            </>
          )}
        </form>
      </div>
    </footer>
  );
}
