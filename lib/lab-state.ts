"use client";

import { createLocalStore } from "./local-store";

/* ---------------- Cài đặt Lab ---------------- */

export type LabSettings = {
  gtmId: string;
  /** Bật các "lỗi tracking" thường gặp để luyện debug trong GTM Preview */
  bugs: {
    duplicatePurchase: boolean; // purchase bắn lại mỗi lần reload trang cảm ơn
    missingTransactionId: boolean; // thiếu transaction_id → không khử trùng lặp được
    stringValue: boolean; // value là chuỗi "18.900.000 ₫" thay vì số
    noEcommerceReset: boolean; // không push { ecommerce: null } trước mỗi event
  };
};

export const settingsStore = createLocalStore<LabSettings>("lab_settings", {
  gtmId: "",
  bugs: {
    duplicatePurchase: false,
    missingTransactionId: false,
    stringValue: false,
    noEcommerceReset: false,
  },
});

/* ---------------- Consent ---------------- */

export type ConsentState = {
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  analytics_storage: "granted" | "denied";
};

/** `decided=false` → chưa chọn, hiện banner */
export const consentStore = createLocalStore<{ decided: boolean; state: ConsentState }>(
  "lab_consent_ui",
  {
    decided: false,
    state: {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    },
  },
);

/* ---------------- Giỏ hàng ---------------- */

export type CartLine = { productId: string; variant: string; quantity: number };

export const cartStore = createLocalStore<{ lines: CartLine[]; coupon: string }>("lab_cart", {
  lines: [],
  coupon: "",
});

/* ---------------- Attribution (nguồn click) ---------------- */

export type Touch = {
  ts: number;
  landing: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

export const attributionStore = createLocalStore<{ first?: Touch; last?: Touch }>(
  "lab_attribution",
  {},
);

/** Tên "kênh" dùng làm khoá cho báo cáo phễu (mô hình last non-direct click). */
export function channelKey(t?: Touch): string {
  if (!t) return "(direct)";
  // GCLID hết hạn sau 90 ngày
  if (Date.now() - t.ts > 90 * 24 * 3600 * 1000) return "(direct)";
  if (t.utm_campaign) return t.utm_campaign;
  if (t.gclid || t.gbraid || t.wbraid) return "(google ads – thiếu utm)";
  if (t.utm_source) return `${t.utm_source} / ${t.utm_medium ?? "(none)"}`;
  return "(direct)";
}

/* ---------------- Số liệu phễu (local analytics) ---------------- */

export const FUNNEL_STEPS = [
  "session_start",
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export type ChannelStats = Record<FunnelStep, number> & {
  clicks: number;
  revenue: number;
  leads: number;
};

export function emptyStats(): ChannelStats {
  return {
    clicks: 0,
    session_start: 0,
    view_item: 0,
    add_to_cart: 0,
    begin_checkout: 0,
    add_shipping_info: 0,
    add_payment_info: 0,
    purchase: 0,
    revenue: 0,
    leads: 0,
  };
}

export const statsStore = createLocalStore<{ byChannel: Record<string, ChannelStats> }>(
  "lab_stats",
  { byChannel: {} },
);

export function bumpStat(
  channel: string,
  field: keyof ChannelStats,
  amount = 1,
) {
  statsStore.set((prev) => {
    const cur = { ...emptyStats(), ...(prev.byChannel[channel] ?? {}) };
    cur[field] += amount;
    return { byChannel: { ...prev.byChannel, [channel]: cur } };
  });
}

/* ---------------- Đơn hàng ---------------- */

export type Order = {
  transaction_id: string;
  created: number;
  items: { productId: string; variant: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  coupon: string;
  shipping: number;
  shipping_tier: string;
  payment_type: string;
  value: number; // giá trị chuyển đổi = subtotal - discount (không gồm ship)
  customer: {
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    street: string;
    city: string;
    region: string;
    postal_code: string;
  };
  channel: string;
  gclid?: string;
  new_customer: boolean;
  /** Người dùng tích ô đồng ý chia sẻ dữ liệu băm cho Enhanced Conversions */
  ec_consent: boolean;
};
// Đơn hàng được "backend" giả lập lưu và trả về — xem lib/order-api.ts

/* ---------------- Xoá dữ liệu (quyền xoá của chủ thể dữ liệu) ---------------- */

export const LAB_STORAGE_KEYS = [
  "lab_cart",
  "lab_stats",
  "lab_attribution",
  "lab_consent_ui",
  "lab_settings",
  "lab_customers",
  "lab_orders",
  "lab_tracked_purchases",
];

/** Xoá mọi dữ liệu website lưu trong trình duyệt này. Cookie của Google do Google quản lý. */
export function clearLabData() {
  LAB_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
  sessionStorage.clear();
}
