"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { attributionStore, cartStore, saveLastOrder, type Order } from "@/lib/lab-state";
import { computeTotals } from "@/lib/cart";
import { PAYMENT_OPTIONS, SHIPPING_OPTIONS, formatVND } from "@/lib/products";
import { useHydrated, useTrackOnce } from "@/lib/hooks";
import { currentChannel, linesToItems, trackEcommerce } from "@/lib/tracking";

type Customer = Order["customer"];

const SAMPLE: Customer = {
  email: "Nguyen.An@Example.com ",
  phone: "0912 345 678",
  first_name: "An",
  last_name: "Nguyễn",
  street: "12 Lý Thái Tổ",
  city: "Hoàn Kiếm",
  region: "Hà Nội",
  postal_code: "100000",
};

/** Sinh mã đơn — đặt ngoài component vì Date.now() không thuần */
function newOrderMeta() {
  const now = Date.now();
  return { transaction_id: `NM-${now.toString(36).toUpperCase()}`, created: now };
}

const EMPTY: Customer = { email: "", phone: "", first_name: "", last_name: "", street: "", city: "", region: "", postal_code: "" };

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const cart = cartStore.useStore();
  const [step, setStep] = useState<"info" | "payment">("info");
  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [shippingId, setShippingId] = useState<string>(SHIPPING_OPTIONS[0].id);
  const [paymentId, setPaymentId] = useState<string>(PAYMENT_OPTIONS[0].id);
  const [placing, setPlacing] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [ecConsent, setEcConsent] = useState(false);

  const shipping = SHIPPING_OPTIONS.find((s) => s.id === shippingId)!;
  const payment = PAYMENT_OPTIONS.find((p) => p.id === paymentId)!;
  const { resolved, subtotal, discount, value, total, couponValid } = computeTotals(cart.lines, cart.coupon, shipping.price);
  const coupon = couponValid ? cart.coupon : "";
  const items = linesToItems(cart.lines, coupon);

  // begin_checkout: vào trang checkout với giỏ có hàng
  useTrackOnce(hydrated && cart.lines.length > 0 ? "begin_checkout" : null, () => {
    trackEcommerce("begin_checkout", { value, coupon: coupon || undefined, items });
  });

  function submitInfo(e: React.FormEvent) {
    e.preventDefault();
    // add_shipping_info: hoàn thành bước địa chỉ + chọn phương thức giao hàng
    trackEcommerce("add_shipping_info", { value, coupon: coupon || undefined, shipping_tier: shipping.id, items });
    setStep("payment");
    window.scrollTo({ top: 0 });
  }

  function placeOrder() {
    setPlacing(true);
    // add_payment_info: chọn/nhập phương thức thanh toán
    trackEcommerce("add_payment_info", { value, coupon: coupon || undefined, payment_type: payment.id, items });

    const known: string[] = JSON.parse(localStorage.getItem("lab_customers") || "[]");
    const email = customer.email.trim().toLowerCase();
    const isNew = !known.includes(email);
    if (isNew) localStorage.setItem("lab_customers", JSON.stringify([...known, email]));

    const last = attributionStore.get().last;
    const order: Order = {
      ...newOrderMeta(),
      items: resolved.map((l) => ({ productId: l.productId, variant: l.variant, quantity: l.quantity, price: l.product.price })),
      subtotal,
      discount,
      coupon,
      shipping: shipping.price,
      shipping_tier: shipping.id,
      payment_type: payment.id,
      value,
      customer,
      channel: currentChannel(),
      gclid: last?.gclid,
      tracked: false,
      new_customer: isNew,
      ec_consent: ecConsent,
    };
    saveLastOrder(order);
    cartStore.set({ lines: [], coupon: "" });
    // Giả lập thời gian xử lý thanh toán
    window.setTimeout(() => router.push("/checkout/success"), 600);
  }

  if (!hydrated) return <div className="mx-auto max-w-6xl px-4 py-10 text-muted">Đang tải…</div>;

  if (resolved.length === 0 && !placing) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Chưa có gì để thanh toán</h1>
        <Link href="/" className="btn-primary mt-6">Xem sản phẩm</Link>
      </div>
    );
  }

  const field = (key: keyof Customer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`f-${key}`} className="label">{label}</label>
      <input
        id={`f-${key}`}
        name={key}
        required
        className="field"
        value={customer[key]}
        onChange={(e) => setCustomer((c) => ({ ...c, [key]: e.target.value }))}
        {...props}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ol className="mb-6 flex gap-2 text-xs font-medium">
        {["Giỏ hàng", "Thông tin giao hàng", "Thanh toán", "Hoàn tất"].map((s, i) => {
          const active = (step === "info" && i === 1) || (step === "payment" && i === 2);
          const done = i === 0 || (step === "payment" && i === 1);
          return (
            <li key={s} className={`rounded-full px-3 py-1 ${active ? "bg-accent text-accent-ink" : done ? "bg-[#e8efe8] text-accent" : "bg-[#efe9e0] text-muted"}`}>
              {i + 1}. {s}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-8 md:grid-cols-[1fr_340px]">
        {step === "info" ? (
          <form onSubmit={submitInfo} className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Thông tin giao hàng</h1>
              <button type="button" className="text-sm text-accent underline underline-offset-2" onClick={() => setCustomer(SAMPLE)}>
                Điền dữ liệu mẫu
              </button>
            </div>
            <p className="-mt-3 rounded-lg bg-[#f6ecd6] px-3 py-2 text-sm text-[#5c4410]">
              <b>Đừng nhập thông tin thật</b> — bấm “Điền dữ liệu mẫu”. Đây là demo, không có giao hàng hay thanh toán.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("email", "Email", { type: "email", autoComplete: "email", spellCheck: false })}
              {field("phone", "Số điện thoại", { type: "tel", autoComplete: "tel" })}
              {field("last_name", "Họ", { autoComplete: "family-name" })}
              {field("first_name", "Tên", { autoComplete: "given-name" })}
              <div className="sm:col-span-2">{field("street", "Địa chỉ", { autoComplete: "street-address" })}</div>
              {field("city", "Quận / Huyện", { autoComplete: "address-level2" })}
              {field("region", "Tỉnh / Thành phố", { autoComplete: "address-level1" })}
              {field("postal_code", "Mã bưu chính", { autoComplete: "postal-code", inputMode: "numeric" })}
            </div>

            <fieldset>
              <legend className="mb-2 font-semibold">Phương thức giao hàng <span className="font-mono text-xs font-normal text-muted">shipping_tier</span></legend>
              <div className="space-y-2">
                {SHIPPING_OPTIONS.map((s) => (
                  <label key={s.id} className={`card flex cursor-pointer items-center gap-3 px-4 py-3 ${shippingId === s.id ? "border-accent" : ""}`}>
                    <input type="radio" name="shipping" checked={shippingId === s.id} onChange={() => setShippingId(s.id)} />
                    <span className="flex-1 text-sm">{s.label}</span>
                    <span className="text-sm font-medium tabular-nums">{s.price ? formatVND(s.price) : "Miễn phí"}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-2 rounded-lg border border-line p-4 text-sm">
              <label className="flex gap-2">
                <input type="checkbox" className="mt-1" required checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                <span>
                  <b>Bắt buộc:</b> Tôi hiểu đây là đơn hàng giả lập (không mua bán, không thu tiền) và đồng ý với{" "}
                  <Link href="/terms" className="text-accent underline">Điều khoản</Link> &amp;{" "}
                  <Link href="/privacy" className="text-accent underline">Chính sách bảo mật</Link>.
                </span>
              </label>
              <label className="flex gap-2">
                <input type="checkbox" className="mt-1" checked={ecConsent} onChange={(e) => setEcConsent(e.target.checked)} />
                <span>
                  <b>Tuỳ chọn:</b> Đồng ý gửi email, SĐT, họ tên, địa chỉ ở dạng đã mã hoá (SHA-256) tới Google (máy chủ ngoài Việt Nam)
                  để đo lường hiệu quả quảng cáo — <i>Enhanced Conversions</i>. Không tích vẫn đặt hàng được.
                </span>
              </label>
            </div>
            <button className="btn-primary w-full py-3" disabled={!agreeTerms}>Tiếp tục tới thanh toán</button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Thanh toán</h1>
              <button className="text-sm text-accent underline underline-offset-2" onClick={() => setStep("info")}>← Sửa thông tin</button>
            </div>
            <div className="card p-4 text-sm">
              <p className="font-medium">{customer.last_name} {customer.first_name} · {customer.phone}</p>
              <p className="text-muted">{customer.street}, {customer.city}, {customer.region}</p>
              <p className="text-muted">{shipping.label}</p>
            </div>
            <fieldset>
              <legend className="mb-2 font-semibold">Phương thức thanh toán <span className="font-mono text-xs font-normal text-muted">payment_type</span></legend>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((p) => (
                  <label key={p.id} className={`card flex cursor-pointer items-center gap-3 px-4 py-3 ${paymentId === p.id ? "border-accent" : ""}`}>
                    <input type="radio" name="payment" checked={paymentId === p.id} onChange={() => setPaymentId(p.id)} />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button className="btn-primary w-full py-3" onClick={placeOrder} disabled={placing}>
              {placing ? "Đang xử lý…" : `Đặt hàng — ${formatVND(total)}`}
            </button>
            <p className="text-xs text-muted">Không có thanh toán thật. Bấm sẽ bắn <code className="font-mono">add_payment_info</code>, rồi trang cảm ơn bắn <code className="font-mono">purchase</code>.</p>
          </div>
        )}

        <aside className="card h-fit p-5">
          <p className="font-semibold">Đơn hàng</p>
          <ul className="mt-3 space-y-2 text-sm">
            {resolved.map((l) => (
              <li key={`${l.productId}-${l.variant}`} className="flex justify-between gap-3">
                <span>{l.product.name} <span className="text-muted">({l.variant}) ×{l.quantity}</span></span>
                <span className="tabular-nums">{formatVND(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Tạm tính</dt><dd className="tabular-nums">{formatVND(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between"><dt className="text-muted">Giảm ({coupon})</dt><dd className="tabular-nums">−{formatVND(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Vận chuyển</dt><dd className="tabular-nums">{shipping.price ? formatVND(shipping.price) : "0 ₫"}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Tổng thanh toán</dt><dd className="tabular-nums">{formatVND(total)}</dd></div>
          </dl>
          <p className="mt-3 rounded bg-[#f3efe9] px-3 py-2 text-xs text-muted">
            Giá trị chuyển đổi gửi đi (<code className="font-mono">value</code>) = {formatVND(value)} — không gồm phí ship.
          </p>
        </aside>
      </div>
    </div>
  );
}
