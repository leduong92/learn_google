"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * Đọc thẳng window.dataLayer (poll mỗi 500ms) — không can thiệp vào code của bạn.
 * Trước Bài 1, window.dataLayer chưa tồn tại → panel báo "chưa có".
 */
function subscribe(cb: () => void) {
  const t = window.setInterval(cb, 500);
  return () => window.clearInterval(t);
}
const getVersion = () => (Array.isArray(window.dataLayer) ? window.dataLayer.length : -1);

/** gtag() push vào dataLayer một object `arguments` → đổi sang dạng dễ đọc */
function normalize(e: unknown): unknown {
  if (Object.prototype.toString.call(e) === "[object Arguments]") return { gtag: Array.from(e as ArrayLike<unknown>) };
  return e;
}

const ECOM = new Set([
  "view_item_list",
  "select_item",
  "view_item",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
]);

/* eslint-disable @typescript-eslint/no-explicit-any */
function labelOf(data: any): { name: string; kind: "ecom" | "gtag" | "gtm" | "custom" | "reset" | "data" } {
  if (data && Array.isArray(data.gtag)) return { name: `gtag(${data.gtag.slice(0, 2).map((x: unknown) => JSON.stringify(x)).join(", ")})`, kind: "gtag" };
  if (data && typeof data.event === "string") {
    const e = data.event as string;
    if (e.startsWith("gtm.")) return { name: e, kind: "gtm" };
    if (ECOM.has(e)) return { name: e, kind: "ecom" };
    return { name: e, kind: "custom" };
  }
  if (data && "ecommerce" in data && data.ecommerce === null) return { name: "{ ecommerce: null }", kind: "reset" };
  return { name: "(push dữ liệu, không có event)", kind: "data" };
}

/** Kiểm tra nhanh các lỗi phổ biến của event ecommerce */
function lint(data: any): string[] {
  const w: string[] = [];
  if (!data || !ECOM.has(data.event)) return w;
  const eco = data.ecommerce;
  if (!eco) return ["Thiếu object ecommerce"];
  if (!Array.isArray(eco.items) || eco.items.length === 0) w.push("items rỗng hoặc không phải mảng");
  if ("value" in eco && typeof eco.value !== "number") w.push(`value phải là số, đang là ${typeof eco.value}: ${JSON.stringify(eco.value)}`);
  if ("value" in eco && !eco.currency) w.push("có value nhưng thiếu currency");
  if (data.event === "purchase" && !eco.transaction_id) w.push("purchase thiếu transaction_id → không khử trùng lặp được");
  for (const it of eco.items ?? []) {
    if (!it.item_id && !it.item_name) w.push("item thiếu cả item_id lẫn item_name");
    if (typeof it.price !== "number") w.push(`price của ${it.item_id} không phải số`);
  }
  return w;
}

const KIND_STYLE: Record<string, string> = {
  ecom: "bg-[#2f4a34] text-[#c9f0cf]",
  gtag: "bg-[#3a3352] text-[#d9d0ff]",
  gtm: "bg-[#2a2e36] text-[#9aa3b2]",
  custom: "bg-[#4a3d22] text-[#ffe0a3]",
  reset: "bg-[#2a2e36] text-[#9aa3b2]",
  data: "bg-[#2a2e36] text-[#c7ccd6]",
};

export function DebugPanel() {
  const version = useSyncExternalStore(subscribe, getVersion, () => -1);
  const [open, setOpen] = useState(false);
  const [hideNoise, setHideNoise] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  // "Xoá log" chỉ ẩn các mục cũ — KHÔNG xoá dataLayer thật (sẽ làm hỏng GTM)
  const [offset, setOffset] = useState(0);

  const exists = version >= 0;
  const log = exists ? window.dataLayer.slice(offset).map(normalize) : [];
  const rows = log
    .map((data, j) => ({ data, i: offset + j, ...labelOf(data), warnings: lint(data) }))
    .filter((r) => !hideNoise || (r.kind !== "gtm" && r.kind !== "reset"))
    .reverse();
  const warnCount = log.reduce<number>((n, d) => n + lint(d).length, 0);
  const count = exists ? version - offset : 0;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-lab px-4 py-2.5 font-mono text-xs font-semibold text-lab-ink shadow-lg hover:bg-black"
        aria-expanded={open}
      >
        dataLayer <span className="rounded-full bg-[#9fd3a7] px-1.5 text-lab">{exists ? count : "—"}</span>
        {warnCount > 0 && <span className="rounded-full bg-[#f08a6b] px-1.5 text-lab">⚠ {warnCount}</span>}
      </button>

      {open && (
        <aside className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-lab text-lab-ink shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <p className="font-mono text-sm font-semibold">window.dataLayer</p>
            <label className="ml-auto flex items-center gap-1.5 text-xs text-[#9aa3b2]">
              <input type="checkbox" checked={hideNoise} onChange={(e) => setHideNoise(e.target.checked)} />
              ẩn gtm.* &amp; reset
            </label>
            <button
              className="rounded px-2 py-1 text-xs text-[#9aa3b2] hover:bg-white/10"
              onClick={() => setOffset(exists ? version : 0)}
            >
              Xoá log
            </button>
            <button className="rounded px-2 py-1 text-sm hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Đóng">
              ✕
            </button>
          </div>
          <p className="border-b border-white/10 px-4 py-2 text-[11px] leading-5 text-[#9aa3b2]">
            Đây là nội dung <code>window.dataLayer</code> — thứ GTM “nghe”. Dùng song song với <b>GTM Preview (Tag Assistant)</b>.
            Reload trang thì dataLayer bắt đầu lại từ đầu.
          </p>
          <ol className="flex-1 overflow-y-auto px-2 py-2">
            {!exists && (
              <li className="px-2 py-6 text-center text-xs text-[#9aa3b2]">
                <code>window.dataLayer</code> chưa tồn tại — hãy làm Bài 1 (nhúng GTM).
              </li>
            )}
            {exists && rows.length === 0 && <li className="px-2 py-6 text-center text-xs text-[#9aa3b2]">Chưa có event.</li>}
            {rows.map((r) => (
              <li key={r.i} className="mb-1">
                <button
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-white/5"
                  onClick={() => setExpanded(expanded === r.i ? null : r.i)}
                >
                  <span className="w-8 shrink-0 font-mono text-[10px] text-[#6f7787]">#{r.i}</span>
                  <span className={`truncate rounded px-1.5 py-0.5 font-mono text-[11.5px] ${KIND_STYLE[r.kind]}`}>{r.name}</span>
                  {r.warnings.length > 0 && <span className="ml-auto text-xs text-[#f08a6b]">⚠ {r.warnings.length}</span>}
                </button>
                {expanded === r.i && (
                  <div className="mx-2 mb-2">
                    {r.warnings.map((w) => (
                      <p key={w} className="mb-1 rounded bg-[#4a2a22] px-2 py-1 text-[11px] text-[#ffb8a3]">⚠ {w}</p>
                    ))}
                    <pre className="max-h-96 overflow-auto rounded bg-black/40 p-2 font-mono text-[11px] leading-5 text-[#c7ccd6]">
                      {JSON.stringify(r.data, null, 2)}
                    </pre>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </aside>
      )}
    </>
  );
}
