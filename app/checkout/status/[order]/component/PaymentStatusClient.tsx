"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartStore } from "@/lib/lab-state";
import { orderApi, type OrderDto } from "@/lib/order-api";
import { formatVND, getProductById } from "@/lib/products";
import { trackPurchase } from "@/lib/datalayer";

type FinalStatus =
  | "pending"
  | "authorized"
  | "failed"
  | "timeout"
  | "not_found";

/** Hỏi lại API mỗi 3 giây, tối đa 30 giây */
const POLL_INTERVAL = 3_000;
const MAX_TIME = 30_000;

export default function PaymentStatusClient({ order }: { order: string }) {
  const [orderData, setOrderData] = useState<OrderDto>();
  const [finalStatus, setFinalStatus] = useState<FinalStatus>("pending");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = Date.now();

    const poll = async () => {
      try {
        const res = await orderApi.getTracking(order);
        if (!isMounted) return; // đã rời trang (hoặc React StrictMode huỷ lượt chạy đầu)
        setAttempts((n) => n + 1);

        if (!res.isSuccess) {
          setFinalStatus("not_found");
          return;
        }

        const status = res.data.orderStatusLabel.toLowerCase();
        if (status === "authorized" || status === "paid") {
          cartStore.set({ lines: [], coupon: "" }); // thanh toán xong mới xoá giỏ
          setOrderData(res.data);
          setFinalStatus("authorized");
          // TODO Bài 5 (chỗ 2/2) — gửi purchase ở đây: gọi trackPurchase(...) (đã import sẵn ở đầu file)
          //   Truyền dữ liệu API VỪA trả về. Đừng dùng orderData — xem khung ⚠ ở Bài 5 để biết vì sao.
          if (!isMounted) return;

          if (res.isSuccess) {
            const status = res.data.orderStatusLabel.toLowerCase();
            if (status === "authorized" || status === "paid") {
              cartStore.set({ lines: [], coupon: "" }); // thanh toán xong mới xoá giỏ
              setOrderData(res.data);
              setFinalStatus("authorized");
              trackPurchase(res.data); // ✅ res.data — KHÔNG phải orderData
              return;
            }
          }
          return;
        }
        if (status === "failed") {
          setOrderData(res.data);
          setFinalStatus("failed"); // không gửi purchase — chưa có doanh thu
          return;
        }

        // Vẫn Pending → hỏi lại sau 3 giây, quá 30 giây thì dừng
        if (Date.now() - start < MAX_TIME)
          timer = setTimeout(poll, POLL_INTERVAL);
        else {
          setOrderData(res.data);
          setFinalStatus("timeout");
        }
      } catch {
        if (!isMounted) return;
        if (Date.now() - start < MAX_TIME)
          timer = setTimeout(poll, POLL_INTERVAL);
        else setFinalStatus("timeout");
      }
    };

    poll();

    return () => {
      isMounted = false;
      clearTimeout(timer); // dọn lịch hỏi lại khi rời trang
    };
  }, [order]);

  if (finalStatus === "pending")
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span
          className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"
          aria-hidden
        />
        <p className="font-medium">Đang kiểm tra trạng thái thanh toán…</p>
        <p className="mt-2 text-sm text-muted">
          Mã đơn <span className="font-mono text-foreground">{order}</span> · đã
          hỏi API {attempts} lần
        </p>
        <p className="mt-4 max-w-sm text-xs text-muted">
          Giả lập Stripe: đơn ở trạng thái <b>Pending</b> khoảng 5 giây. Trang
          này tự hỏi lại mỗi 3 giây, tối đa 30 giây.
        </p>
      </div>
    );

  if (finalStatus === "not_found")
    return (
      <div className="py-16 text-center">
        <p className="text-5xl" aria-hidden>
          🔍
        </p>
        <h1 className="mt-3 text-2xl font-bold">Không tìm thấy đơn hàng</h1>
        <p className="mt-2 text-muted">
          Mã <span className="font-mono">{order}</span> không có trong trình
          duyệt này. Hãy đặt một đơn mới.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Mua sắm
        </Link>
      </div>
    );

  if (finalStatus !== "authorized")
    return (
      <div className="card max-w-lg p-10 text-center">
        <p className="text-5xl" aria-hidden>
          {finalStatus === "timeout" ? "⏳" : "😞"}
        </p>
        <h1 className="mt-3 text-2xl font-bold">
          {finalStatus === "timeout"
            ? "Chưa xác nhận được thanh toán"
            : "Thanh toán không thành công"}
        </h1>
        <p className="mt-2 text-muted">
          {finalStatus === "timeout"
            ? "Ngân hàng vẫn đang xử lý. Bạn sẽ nhận email khi đơn được xác nhận — chưa cần thanh toán lại."
            : "Thẻ bị từ chối. Giỏ hàng vẫn còn nguyên — bạn có thể thử lại."}
        </p>
        <p className="mt-2 text-sm text-muted">
          Mã đơn <span className="font-mono text-foreground">{order}</span> ·
          trạng thái{" "}
          <span className="font-mono">
            {orderData?.orderStatusLabel ?? "?"}
          </span>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {finalStatus === "failed" && (
            <Link href="/checkout" className="btn-primary">
              Thử thanh toán lại
            </Link>
          )}
          <Link href="/lab/guide#bai-5" className="btn-ghost">
            Xem Bài 5
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted">
          Không có event <code className="font-mono">purchase</code> nào được
          gửi — đúng, vì chưa có doanh thu.
        </p>
      </div>
    );

  const o = orderData!;
  return (
    <div className="w-full max-w-lg">
      <div className="text-center">
        <p className="text-5xl" aria-hidden>
          🎉
        </p>
        <h1 className="mt-3 text-3xl font-bold">Thanh toán thành công!</h1>
        <p className="mt-2 text-muted">
          Mã đơn{" "}
          <span className="font-mono text-foreground">{o.transaction_id}</span>{" "}
          · trạng thái <span className="font-mono">{o.orderStatusLabel}</span>
        </p>
      </div>

      <div className="card mt-6 p-5">
        <ul className="space-y-2 text-sm">
          {o.items.map((l) => {
            const p = getProductById(l.productId);
            return (
              <li
                key={`${l.productId}-${l.variant}`}
                className="flex justify-between gap-3"
              >
                <span>
                  {p?.name}{" "}
                  <span className="text-muted">
                    ({l.variant}) ×{l.quantity}
                  </span>
                </span>
                <span className="tabular-nums">
                  {formatVND(l.price * l.quantity)}
                </span>
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
          {o.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Giảm giá ({o.coupon})</dt>
              <dd>−{formatVND(o.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Vận chuyển ({o.shipping_tier})</dt>
            <dd>{formatVND(o.shipping)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Đã thanh toán</dt>
            <dd>{formatVND(o.value + o.shipping)}</dd>
          </div>
        </dl>
        <p className="mt-3 rounded bg-[#f3efe9] px-3 py-2 text-xs text-muted">
          <code className="font-mono">purchase</code> gửi{" "}
          <code className="font-mono">value</code> = {formatVND(o.value)} (không
          gồm ship). Reload trang này: KHÔNG có purchase mới.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/lab/guide#bai-5" className="btn-primary">
          Quay lại bài học
        </Link>
        <Link href="/" className="btn-ghost">
          Mua tiếp
        </Link>
      </div>
    </div>
  );
}
