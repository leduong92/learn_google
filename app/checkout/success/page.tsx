"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { consentStore, loadLastOrder, saveLastOrder, settingsStore, type Order } from "@/lib/lab-state";
import { formatVND, getProductById } from "@/lib/products";
import { useHydrated, useTrackOnce } from "@/lib/hooks";
import { normalizePhoneVN, sha256, toItem, trackEcommerce } from "@/lib/tracking";

async function buildUserData(c: Order["customer"]) {
  // Chuẩn hoá theo yêu cầu Enhanced Conversions: email lowercase + trim, SĐT dạng E.164
  const email = c.email.trim().toLowerCase();
  const phone = normalizePhoneVN(c.phone);
  const first = c.first_name.trim().toLowerCase();
  const last = c.last_name.trim().toLowerCase();
  return {
    user_data: {
      email,
      phone_number: phone,
      address: {
        first_name: first,
        last_name: last,
        street: c.street.trim(),
        city: c.city.trim(),
        region: c.region.trim(),
        postal_code: c.postal_code.trim(),
        country: "VN",
      },
    },
    // Bản đã hash SHA-256 — dùng khi bạn không muốn đưa PII thô vào dataLayer
    user_data_sha256: {
      sha256_email_address: await sha256(email),
      sha256_phone_number: await sha256(phone),
      address: {
        sha256_first_name: await sha256(first),
        sha256_last_name: await sha256(last),
        city: c.city.trim(),
        region: c.region.trim(),
        postal_code: c.postal_code.trim(),
        country: "VN",
      },
    },
  };
}

export default function SuccessPage() {
  const hydrated = useHydrated();
  const order = useMemo(() => (hydrated ? loadLastOrder() : null), [hydrated]);
  const [status, setStatus] = useState<"sent" | "skipped" | null>(null);

  useTrackOnce(hydrated && order ? order.transaction_id : null, () => {
    if (!order) return;
    const { bugs } = settingsStore.get();
    // ✅ Chống bắn trùng: chỉ gửi purchase 1 lần cho mỗi đơn, kể cả khi reload trang cảm ơn
    if (order.tracked && !bugs.duplicatePurchase) {
      setStatus("skipped");
      return;
    }
    const items = order.items.flatMap((l) => {
      const p = getProductById(l.productId);
      return p ? [toItem(p, { variant: l.variant, quantity: l.quantity, coupon: order.coupon })] : [];
    });
    // Chỉ gửi dữ liệu người dùng khi có CẢ sự đồng ý riêng ở checkout VÀ consent ad_user_data
    const ecAllowed = order.ec_consent && consentStore.get().state.ad_user_data === "granted";
    (ecAllowed ? buildUserData(order.customer) : Promise.resolve({})).then((ud) => {
      trackEcommerce(
        "purchase",
        {
          transaction_id: order.transaction_id,
          value: order.value,
          tax: 0,
          shipping: order.shipping,
          coupon: order.coupon || undefined,
          items,
        },
        {
          ...ud,
          enhanced_conversions_allowed: ecAllowed,
          new_customer: order.new_customer, // Google Ads: customer acquisition goal
          payment_type: order.payment_type,
          gclid: order.gclid, // để đối chiếu / offline conversion import
          traffic_channel: order.channel,
        },
      );
      saveLastOrder({ ...order, tracked: true });
      setStatus("sent");
    });
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
        Mã đơn <span className="font-mono text-foreground">{order.transaction_id}</span> · Nguồn:{" "}
        <span className="font-mono text-foreground">{order.channel}</span>
        {order.gclid && <> · gclid <span className="font-mono text-foreground">{order.gclid.slice(0, 14)}…</span></>}
      </p>

      <div
        className={`mt-6 rounded-lg px-4 py-3 text-sm ${
          status === "skipped" ? "bg-[#f6ecd6] text-[#7a5a12]" : "bg-[#e8efe8] text-accent"
        }`}
      >
        {status === "sent" && (
          <>Đã push event <b>purchase</b> (value {formatVND(order.value)}). Reload trang này để kiểm tra cơ chế chống trùng.</>
        )}
        {status === "skipped" && (
          <>
            Đơn này đã được track trước đó → <b>không</b> bắn lại purchase. Bật lỗi “duplicatePurchase” ở{" "}
            <Link href="/lab/settings" className="underline">Cài đặt</Link> để xem điều gì xảy ra nếu thiếu cơ chế này.
          </>
        )}
        {status === null && "Đang chuẩn bị event purchase…"}
      </div>

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
        <Link href="/lab/funnel" className="btn-primary">Xem phễu &amp; ROAS</Link>
        <Link href="/lab/ads" className="btn-ghost">Giả lập click Ads khác</Link>
      </div>
    </div>
  );
}
