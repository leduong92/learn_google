"use client";

import Link from "next/link";
import { useState } from "react";
import { cartStore } from "@/lib/lab-state";
import { computeTotals } from "@/lib/cart";
import { formatVND } from "@/lib/products";
import { useHydrated, useTrackOnce } from "@/lib/hooks";
import { ProductImage } from "@/components/ProductImage";
import { pushEcommerce, toItem } from "@/lib/datalayer";

export default function CartPage() {
  const hydrated = useHydrated();
  const cart = cartStore.useStore();
  const { resolved, subtotal, discount, value, couponValid } = computeTotals(
    cart.lines,
    cart.coupon,
  );
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  // Chạy 1 lần, SAU khi giỏ hàng đã được đọc từ localStorage (hydrated)
  useTrackOnce(hydrated ? "view_cart" : null, () => {
    if (cart.lines.length === 0) return;
    // TODO Bài 4 — push event "view_cart" (value = `value`, items = các dòng trong `resolved`)
    pushEcommerce("view_cart", {
      value,
      items: resolved.map((l) => toItem(l.product, l.quantity, l.variant)),
    });
  });

  function changeQty(index: number, nextQty: number) {
    const line = resolved[index];
    const diff = nextQty - line.quantity;
    if (diff === 0) return;
    cartStore.set((c) => ({
      ...c,
      lines:
        nextQty <= 0
          ? c.lines.filter((_, i) => i !== index)
          : c.lines.map((l, i) =>
              i === index ? { ...l, quantity: nextQty } : l,
            ),
    }));
    // TODO Bài 4 — diff > 0 → push "add_to_cart", diff < 0 → push "remove_from_cart"
    //   Sản phẩm: line.product, phiên bản: line.variant, số lượng thay đổi: Math.abs(diff)
    const n = Math.abs(diff);
    pushEcommerce(diff > 0 ? "add_to_cart" : "remove_from_cart", {
      value: line.product.price * n,
      items: [toItem(line.product, n, line.variant)],
    });
  }

  function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    const { couponValid: ok } = computeTotals(cart.lines, code);
    if (!ok) {
      setCouponError("Mã không hợp lệ. Thử WELCOME10 hoặc ADS15.");
      return;
    }
    setCouponError("");
    cartStore.set((c) => ({ ...c, coupon: code }));
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-muted">
        Đang tải giỏ hàng…
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Giỏ hàng trống</h1>
        <p className="mt-2 text-muted">
          Thêm vài sản phẩm để tiếp tục hành trình checkout.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Giỏ hàng</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-line">
          {resolved.map((l, i) => (
            <li key={`${l.productId}-${l.variant}`} className="flex gap-4 py-4">
              <ProductImage
                product={l.product}
                className="h-24 w-24 shrink-0 text-4xl"
              />
              <div className="flex-1">
                <Link
                  href={`/products/${l.product.slug}`}
                  className="font-medium hover:underline"
                >
                  {l.product.name}
                </Link>
                <p className="text-sm text-muted">
                  {l.variant} · {formatVND(l.product.price)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="btn-ghost h-8 w-8 p-0"
                    aria-label="Giảm"
                    onClick={() => changeQty(i, l.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-sm tabular-nums">
                    {l.quantity}
                  </span>
                  <button
                    className="btn-ghost h-8 w-8 p-0"
                    aria-label="Tăng"
                    onClick={() => changeQty(i, l.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="ml-3 text-sm text-muted underline underline-offset-2 hover:text-foreground"
                    onClick={() => changeQty(i, 0)}
                  >
                    Xoá
                  </button>
                </div>
              </div>
              <p className="font-semibold tabular-nums">
                {formatVND(l.lineTotal)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="card h-fit p-5">
          <form onSubmit={applyCoupon}>
            <label htmlFor="coupon" className="label">
              Mã giảm giá (coupon)
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                className="field"
                placeholder="WELCOME10"
                autoComplete="off"
                spellCheck={false}
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  setCouponError("");
                }}
              />
              <button className="btn-ghost">Áp dụng</button>
            </div>
            {couponError && (
              <p className="mt-1 text-xs text-[#b4442b]">{couponError}</p>
            )}
            {couponValid && (
              <p className="mt-2 text-xs text-accent">
                Đang dùng <b>{cart.coupon}</b>{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => cartStore.set((c) => ({ ...c, coupon: "" }))}
                >
                  bỏ
                </button>
              </p>
            )}
          </form>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính</dt>
              <dd className="tabular-nums">{formatVND(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Giảm giá</dt>
                <dd className="tabular-nums">−{formatVND(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 font-semibold">
              <dt>Tổng (chưa ship)</dt>
              <dd className="tabular-nums">{formatVND(value)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-5 w-full py-3">
            Tiến hành thanh toán
          </Link>
        </aside>
      </div>
    </div>
  );
}
