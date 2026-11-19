import { COUPONS, getProductById, type Product } from "./products";
import type { CartLine } from "./lab-state";

export type ResolvedLine = CartLine & { product: Product; lineTotal: number };

export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((l) => {
    const product = getProductById(l.productId);
    return product ? [{ ...l, product, lineTotal: product.price * l.quantity }] : [];
  });
}

export function computeTotals(lines: CartLine[], coupon: string, shipping = 0) {
  const resolved = resolveLines(lines);
  const subtotal = resolved.reduce((s, l) => s + l.lineTotal, 0);
  const pct = COUPONS[coupon.toUpperCase()] ?? 0;
  const discount = Math.round((subtotal * pct) / 100);
  return {
    resolved,
    subtotal,
    discount,
    couponValid: pct > 0,
    /** Giá trị chuyển đổi: sau giảm giá, chưa gồm phí ship */
    value: subtotal - discount,
    total: subtotal - discount + shipping,
  };
}
