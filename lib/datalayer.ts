import { getProductById, type Product } from "./products";
import type { OrderDto } from "./order-api";
import { consentStore } from "./lab-state";

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
  const tracked = readTracked();
  if (tracked.includes(order.transaction_id)) return; // ✅ chống trùng — đặt TRƯỚC mọi lần push

  // Bài 8 — chỉ gửi user_data khi người dùng tích ô đồng ý ở checkout VÀ cho phép ad_user_data (Bài 7)
  const allowed =
    order.ec_consent && consentStore.get().state.ad_user_data === "granted";

  window.dataLayer = window.dataLayer || [];
  // Reset cả ecommerce lẫn user_data — dataLayer gộp dữ liệu giữa các lần push
  window.dataLayer.push({ ecommerce: null, user_data: null });
  window.dataLayer.push({
    event: "purchase",
    ecommerce: {
      currency: "VND",
      transaction_id: order.transaction_id,
      value: order.value, // đã trừ giảm giá, KHÔNG gồm ship
      shipping: order.shipping,
      coupon: order.coupon || undefined,
      customer_type: order.new_customer ? "new" : "returning",
      items: order.items.flatMap((it) => {
        const p = getProductById(it.productId);
        return p ? [toItem(p, it.quantity, it.variant)] : [];
      }),
    },
    ...(allowed && {
      user_data: {
        email: order.customer.email.trim().toLowerCase(),
        phone_number:
          "+84" + order.customer.phone.replace(/\D/g, "").replace(/^0/, ""),
      },
    }),
  });

  try {
    localStorage.setItem(
      TRACKED_KEY,
      JSON.stringify([...tracked, order.transaction_id].slice(-50)),
    );
  } catch {
    /* localStorage bị chặn (cửa sổ riêng tư…) — bỏ qua */
  }
}
