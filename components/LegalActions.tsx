"use client";

import { useState } from "react";
import { clearLabData, consentStore } from "@/lib/lab-state";

/** Mở lại banner consent để thay đổi / rút lại sự đồng ý */
export function OpenCookieSettings({ className = "btn-ghost" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => consentStore.set((p) => ({ ...p, decided: false }))}>
      Thay đổi lựa chọn cookie
    </button>
  );
}

/** Xoá dữ liệu website đã lưu trong trình duyệt này */
export function ClearMyData() {
  const [done, setDone] = useState(false);
  if (done) return <p className="text-sm text-accent">Đã xoá. Trang sẽ tải lại…</p>;
  return (
    <button
      type="button"
      className="btn border border-[#d79a8a] text-[#9b3b25] hover:bg-[#fbeeea]"
      onClick={() => {
        if (!window.confirm("Xoá giỏ hàng, đơn hàng giả lập, nguồn truy cập và lựa chọn cookie lưu trên trình duyệt này?")) return;
        clearLabData();
        setDone(true);
        window.setTimeout(() => window.location.reload(), 600);
      }}
    >
      Xoá dữ liệu của tôi trên trình duyệt này
    </button>
  );
}
