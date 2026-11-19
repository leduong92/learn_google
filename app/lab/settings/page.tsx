"use client";

import { useState } from "react";
import { clearLabData, settingsStore, type LabSettings } from "@/lib/lab-state";
import { useHydrated } from "@/lib/hooks";

const BUGS: { key: keyof LabSettings["bugs"]; title: string; lesson: string }[] = [
  {
    key: "duplicatePurchase",
    title: "Purchase bắn lại mỗi lần reload trang cảm ơn",
    lesson: "Conversion bị đếm gấp đôi → ROAS ảo, Smart Bidding học sai. Cách chữa: transaction_id + chỉ push 1 lần.",
  },
  {
    key: "missingTransactionId",
    title: "Thiếu transaction_id trong purchase",
    lesson: "Google Ads & GA4 không khử trùng lặp được. Trong GTM, trường Transaction ID của tag Ads sẽ undefined.",
  },
  {
    key: "stringValue",
    title: "value là chuỗi định dạng (\"18.900.000 ₫\")",
    lesson: "GA4 bỏ qua doanh thu / Ads ghi value = 0. value phải là số thuần.",
  },
  {
    key: "noEcommerceReset",
    title: "Không push { ecommerce: null } trước mỗi event",
    lesson: "dataLayer merge đệ quy: items của event trước có thể dính sang event sau (vd. view_item_list → view_item).",
  },
];

export default function SettingsPage() {
  const hydrated = useHydrated();
  const settings = settingsStore.useStore();
  const [draft, setDraft] = useState<string | null>(null);
  const gtmInput = draft ?? settings.gtmId;
  const valid = gtmInput === "" || /^GTM-[A-Z0-9]+$/i.test(gtmInput.trim());

  function saveGtm(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    settingsStore.set((s) => ({ ...s, gtmId: gtmInput.trim().toUpperCase() }));
    // GTM chỉ được chèn lúc load trang → reload để áp dụng
    window.location.reload();
  }

  function resetAll() {
    if (!window.confirm("Xoá giỏ hàng, số liệu phễu, attribution, consent và cài đặt? Không hoàn tác được.")) return;
    clearLabData();
    // Cần full reload để xoá cache trong bộ nhớ của các store
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  if (!hydrated) return <div className="mx-auto max-w-3xl px-4 py-10 text-muted">Đang tải…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Cài đặt Lab</h1>

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">GTM container ID</h2>
        <p className="mt-1 text-sm text-muted">
          Tạo container loại <b>Web</b> tại tagmanager.google.com, copy ID dạng <code className="font-mono">GTM-XXXXXXX</code>.
          Lưu trong localStorage của trình duyệt này (hoặc đặt biến môi trường <code className="font-mono">NEXT_PUBLIC_GTM_ID</code>).
        </p>
        <form onSubmit={saveGtm} className="mt-4 flex gap-2">
          <label htmlFor="gtm" className="sr-only">GTM ID</label>
          <input
            id="gtm"
            className="field max-w-xs font-mono uppercase"
            placeholder="GTM-ABC1234"
            spellCheck={false}
            autoComplete="off"
            value={gtmInput}
            onChange={(e) => setDraft(e.target.value)}
            aria-invalid={!valid}
          />
          <button className="btn-primary" disabled={!valid}>Lưu &amp; tải lại</button>
        </form>
        {!valid && <p className="mt-1 text-xs text-[#b4442b]">ID phải có dạng GTM-XXXXXXX.</p>}
        <p className="mt-3 text-xs text-muted">Để trống = chạy không có GTM (vẫn xem được dataLayer trong Debug panel).</p>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Chế độ “lỗi tracking” để luyện debug</h2>
        <p className="mt-1 text-sm text-muted">
          Bật một lỗi → đi lại flow mua hàng → quan sát trong Debug panel (có cảnh báo ⚠) và GTM Preview.
        </p>
        <ul className="mt-4 space-y-3">
          {BUGS.map((b) => (
            <li key={b.key}>
              <label className="flex cursor-pointer gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.bugs[b.key]}
                  onChange={(e) => settingsStore.set((s) => ({ ...s, bugs: { ...s.bugs, [b.key]: e.target.checked } }))}
                />
                <span>
                  <span className="block text-sm font-medium">{b.title}</span>
                  <span className="block text-sm text-muted">{b.lesson}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-6 border-[#e7c9c0] p-5">
        <h2 className="font-semibold">Làm lại từ đầu</h2>
        <p className="mt-1 text-sm text-muted">Xoá toàn bộ dữ liệu lab trong trình duyệt này.</p>
        <button className="btn mt-3 border border-[#d79a8a] text-[#9b3b25] hover:bg-[#fbeeea]" onClick={resetAll}>
          Xoá toàn bộ dữ liệu lab
        </button>
      </section>
    </div>
  );
}
