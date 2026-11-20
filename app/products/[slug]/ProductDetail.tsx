"use client";

import Link from "next/link";
import { useState } from "react";
import { formatVND, type Product } from "@/lib/products";
import { cartStore } from "@/lib/lab-state";
import { useTrackOnce } from "@/lib/hooks";
import { ProductImage } from "@/components/ProductImage";
import { pushEcommerce, toItem } from "@/lib/dataLayer";

export function ProductDetail({ product: p }: { product: Product }) {
  const [variant, setVariant] = useState(p.variants[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Chạy 1 lần khi mở trang sản phẩm
  useTrackOnce(p.id, () => {
    // TODO Bài 4 — push event "view_item" cho sản phẩm `p` (value = p.price)
    pushEcommerce("view_item", { value: p.price, items: [toItem(p)] });
  });

  function addToCart() {
    cartStore.set((c) => {
      const idx = c.lines.findIndex(
        (l) => l.productId === p.id && l.variant === variant,
      );
      const lines = [...c.lines];
      if (idx >= 0)
        lines[idx] = { ...lines[idx], quantity: lines[idx].quantity + qty };
      else lines.push({ productId: p.id, variant, quantity: qty });
      return { ...c, lines };
    });
    // TODO Bài 3 — push event "add_to_cart" ĐẦU TIÊN của bạn ở đây
    //   Dữ liệu có sẵn: p (sản phẩm), variant (phiên bản), qty (số lượng)
    //   value = p.price * qty

    pushEcommerce("add_to_cart", {
      value: p.price * qty,
      items: [toItem(p, qty, variant)],
    });

    setAdded(true);
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductImage product={p} className="aspect-square text-[9rem]" />
      <div>
        <nav className="text-sm text-muted">
          <Link href="/" className="hover:underline">
            Sản phẩm
          </Link>{" "}
          / {p.category} / {p.category2}
        </nav>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{p.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {p.brand} · <span className="font-mono">{p.id}</span>
        </p>
        <p className="mt-4 text-2xl font-semibold">
          {formatVND(p.price)}
          {p.compareAt && (
            <span className="ml-3 text-base font-normal text-muted line-through">
              {formatVND(p.compareAt)}
            </span>
          )}
        </p>
        <p className="mt-4 leading-7 text-muted">{p.description}</p>

        <fieldset className="mt-6">
          <legend className="label">Phiên bản (item_variant)</legend>
          <div className="flex flex-wrap gap-2">
            {p.variants.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVariant(v)}
                aria-pressed={variant === v}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  variant === v
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line bg-card hover:bg-[#f3efe9]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex items-end gap-3">
          <div>
            <label htmlFor="qty" className="label">
              Số lượng
            </label>
            <input
              id="qty"
              type="number"
              min={1}
              max={10}
              value={qty}
              onChange={(e) =>
                setQty(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
              }
              className="field w-20"
            />
          </div>
          <button className="btn-primary flex-1 py-3" onClick={addToCart}>
            Thêm vào giỏ — {formatVND(p.price * qty)}
          </button>
        </div>

        {added && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#e8efe8] px-4 py-3 text-sm">
            <span>Đã thêm vào giỏ.</span>
            <Link
              href="/cart"
              className="ml-auto font-semibold text-accent underline underline-offset-2"
            >
              Xem giỏ →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
