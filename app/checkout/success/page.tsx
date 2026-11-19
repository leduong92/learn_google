"use client";

import Link from "next/link";
import { useMemo } from "react";
import { loadLastOrder } from "@/lib/lab-state";
import { formatVND, getProductById } from "@/lib/products";
import { useHydrated, useTrackOnce } from "@/lib/hooks";

export default function SuccessPage() {
  const hydrated = useHydrated();
  const order = useMemo(() => (hydrated ? loadLastOrder() : null), [hydrated]);

  // Chạy 1 lần cho mỗi mã đơn khi trang cảm ơn hiển thị
  useTrackOnce(hydrated && order ? order.transaction_id : null, () => {
    if (!order) return;
    // TODO Bài 5 — push event "purchase"
    //   ecommerce: transaction_id, value (= order.value), currency, shipping, coupon, items (từ order.items)
    //   Chống bắn trùng khi reload: nếu order.tracked === true thì KHÔNG push;
    //   push xong thì gọi saveLastOrder({ ...order, tracked: true })
    //
    // TODO Bài 8 — Enhanced Conversions: thêm user_data (email, phone_number, address)
    //   CHỈ khi order.ec_consent === true VÀ người dùng đã cho phép ad_user_data
  });

  if (!hydrated) return <div className="mx-auto max-w-3xl px-4 py-10 text-muted">Đang tải…</div>;

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy đơn hàng</h1>
        <p className="mt-2 text-muted">Đơn hàng lưu trong sessionStorage của tab này. Hãy đặt một đơn mới.</p>
        <Link href="/" className="btn-primary mt-6">Mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-5xl" aria-hidden>🎉</p>
      <h1 className="mt-3 text-3xl font-bold">Cảm ơn bạn đã đặt hàng!</h1>
      <p className="mt-2 text-muted">
        Mã đơn <span className="font-mono text-foreground">{order.transaction_id}</span>
      </p>

      <div className="card mt-6 p-5">
        <ul className="space-y-2 text-sm">
          {order.items.map((l) => {
            const p = getProductById(l.productId);
            return (
              <li key={`${l.productId}-${l.variant}`} className="flex justify-between">
                <span>{p?.name} <span className="text-muted">({l.variant}) ×{l.quantity}</span></span>
                <span className="tabular-nums">{formatVND(l.price * l.quantity)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Giảm giá</dt><dd>−{formatVND(order.discount)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Vận chuyển ({order.shipping_tier})</dt><dd>{formatVND(order.shipping)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Đã thanh toán</dt><dd>{formatVND(order.value + order.shipping)}</dd></div>
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/lab/guide" className="btn-primary">Quay lại bài học</Link>
        <Link href="/" className="btn-ghost">Mua tiếp</Link>
      </div>
    </div>
  );
}
