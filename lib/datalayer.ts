import { getProductById, type Product } from "./products";
import type { OrderDto } from "./order-api";

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

/* ---------------- Bài 5 — purchase ---------------- */

/**
 * Gửi purchase ĐÚNG 1 LẦN cho mỗi mã đơn.
 * Trang /checkout/status/[order] sẽ gọi hàm này khi API báo đơn đã thanh toán (Paid).
 */

const TRACKED_KEY = "lab_tracked_purchases";

function readTracked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(TRACKED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function trackPurchase(order: OrderDto) {
  // TODO Bài 5 (chỗ 1/2) — viết hàm này:
  //   1. Chống trùng: đọc danh sách mã đơn đã gửi từ localStorage (key "lab_tracked_purchases");
  //      nếu order.transaction_id đã có trong danh sách → return (không gửi lại)
  //   2. pushEcommerce("purchase", { ... }) với:
  //        transaction_id, value (= order.value, KHÔNG gồm ship), shipping, coupon (rỗng → undefined),
  //        customer_type ("new" nếu order.new_customer, ngược lại "returning"),
  //        items: đổi order.items thành mảng item — gợi ý: getProductById (từ "./products") + toItem
  //   3. Thêm order.transaction_id vào danh sách rồi lưu lại localStorage
  //
  // TODO Bài 8 — Enhanced Conversions: thêm user_data (email, phone_number, address)
  //   CHỈ khi order.ec_consent === true VÀ người dùng đã cho phép ad_user_data
  const tracked = readTracked();
  if (tracked.includes(order.transaction_id)) return; // ✅ đã gửi → không gửi lại

  pushEcommerce("purchase", {
    transaction_id: order.transaction_id,
    value: order.value, // đã trừ giảm giá, KHÔNG gồm ship
    shipping: order.shipping,
    coupon: order.coupon || undefined,
    customer_type: order.new_customer ? "new" : "returning",
    items: order.items.flatMap((it) => {
      const p = getProductById(it.productId);
      return p ? [toItem(p, it.quantity, it.variant)] : [];
    }),
  });

  localStorage.setItem(
    TRACKED_KEY,
    JSON.stringify([...tracked, order.transaction_id].slice(-50)),
  );
}
