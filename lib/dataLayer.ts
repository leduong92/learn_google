import type { Product } from "./products";

/** Đổi 1 sản phẩm thành 1 phần tử của mảng items (tên chuẩn GA4) */
export function toItem(p: Product, quantity = 1, variant?: string) {
  return {
    item_id: p.id,
    item_name: p.name,
    item_brand: p.brand,
    item_category: p.category,
    item_category2: p.category2,
    item_variant: variant,
    price: p.price,
    quantity,
  };
}

/** Reset ecommerce + push event; currency mặc định VND */
export function pushEcommerce(
  event: string,
  ecommerce: Record<string, unknown>,
) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event,
    ecommerce: { currency: "VND", ...ecommerce },
  });
}
