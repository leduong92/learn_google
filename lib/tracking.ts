"use client";

import { CURRENCY, formatVND, getProductById, type Product } from "./products";
import {
  attributionStore,
  bumpStat,
  channelKey,
  settingsStore,
  type FunnelStep,
  type Touch,
} from "./lab-state";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    __dlLog: { t: number; data: unknown }[];
    __labGtmId: string;
    google_tag_manager?: Record<string, unknown>;
  }
}

/** Push thô vào dataLayer — đây chính là thứ GTM "nghe". */
export function pushDL(obj: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(obj);
}

/* ---------------- Chuẩn hoá item theo GA4 ---------------- */

export type GA4Item = {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  item_category2: string;
  item_variant?: string;
  price: number;
  quantity: number;
  discount?: number;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
  coupon?: string;
  /** Cho Dynamic Remarketing của Google Ads (vertical bán lẻ) */
  google_business_vertical: "retail";
};

export function toItem(
  p: Product,
  opts: {
    quantity?: number;
    variant?: string;
    index?: number;
    listId?: string;
    listName?: string;
    coupon?: string;
  } = {},
): GA4Item {
  return {
    item_id: p.id,
    item_name: p.name,
    item_brand: p.brand,
    item_category: p.category,
    item_category2: p.category2,
    item_variant: opts.variant,
    price: p.price,
    quantity: opts.quantity ?? 1,
    discount: p.compareAt ? p.compareAt - p.price : undefined,
    index: opts.index,
    item_list_id: opts.listId,
    item_list_name: opts.listName,
    coupon: opts.coupon || undefined,
    google_business_vertical: "retail",
  };
}

export function linesToItems(
  lines: { productId: string; variant: string; quantity: number }[],
  coupon?: string,
): GA4Item[] {
  return lines.flatMap((l, i) => {
    const p = getProductById(l.productId);
    return p ? [toItem(p, { quantity: l.quantity, variant: l.variant, index: i, coupon })] : [];
  });
}

export function itemsValue(items: GA4Item[]) {
  return items.reduce((s, it) => s + it.price * it.quantity, 0);
}

/* ---------------- Gửi sự kiện ecommerce ---------------- */

const FUNNEL_EVENTS = new Set<string>([
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
]);

export function currentChannel() {
  return channelKey(attributionStore.get().last);
}

/**
 * Gửi 1 sự kiện ecommerce GA4 vào dataLayer.
 * Best practice: push { ecommerce: null } trước để xoá object ecommerce cũ,
 * tránh dữ liệu của event trước "dính" sang event sau (dataLayer merge đệ quy).
 */
export function trackEcommerce(
  event: string,
  ecommerce: Record<string, unknown> & { items: GA4Item[]; value?: number },
  extra: Record<string, unknown> = {},
) {
  const { bugs } = settingsStore.get();
  const eco: Record<string, unknown> = { currency: CURRENCY, ...ecommerce };

  if (bugs.stringValue && typeof eco.value === "number") {
    eco.value = formatVND(eco.value as number); // ❌ lỗi cố ý
  }
  if (bugs.missingTransactionId && event === "purchase") {
    delete eco.transaction_id; // ❌ lỗi cố ý
  }

  if (!bugs.noEcommerceReset) pushDL({ ecommerce: null });
  pushDL({ event, ecommerce: eco, ...extra });

  if (FUNNEL_EVENTS.has(event)) {
    const ch = currentChannel();
    bumpStat(ch, event as FunnelStep);
    if (event === "purchase" && typeof ecommerce.value === "number") {
      bumpStat(ch, "revenue", ecommerce.value);
    }
  }
}

/* ---------------- Enhanced Conversions ---------------- */

export function normalizePhoneVN(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("84")) return "+" + digits;
  if (digits.startsWith("0")) return "+84" + digits.slice(1);
  return "+" + digits;
}

export async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ---------------- Attribution: bắt gclid / utm khi landing ---------------- */

const ATTR_KEYS = [
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/**
 * Gọi 1 lần mỗi lần load trang (full load hoặc điều hướng có query).
 * Trả về touch mới nếu URL có tham số quảng cáo.
 */
export function captureAttribution(): Touch | null {
  const params = new URLSearchParams(window.location.search);
  const touch: Touch = { ts: Date.now(), landing: window.location.pathname };
  let has = false;
  for (const k of ATTR_KEYS) {
    const v = params.get(k);
    if (v) {
      touch[k] = v;
      has = true;
    }
  }
  if (!has) return null;
  // Tránh đếm lại khi reload cùng URL
  const sig = ATTR_KEYS.map((k) => touch[k] ?? "").join("|");
  if (sessionStorage.getItem("lab_last_touch_sig") === sig) return null;
  sessionStorage.setItem("lab_last_touch_sig", sig);

  attributionStore.set((prev) => ({ first: prev.first ?? touch, last: touch }));
  return touch;
}

/** Phiên mới: chưa có cờ trong sessionStorage, hoặc vừa có click quảng cáo mới. */
export function ensureSession(newTouch: Touch | null) {
  const SESSION_KEY = "lab_session_started";
  const ch = currentChannel();
  if (newTouch) {
    if (newTouch.gclid || newTouch.gbraid || newTouch.wbraid) bumpStat(ch, "clicks");
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    bumpStat(ch, "session_start");
    return;
  }
  if (!sessionStorage.getItem(SESSION_KEY)) {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    bumpStat(ch, "session_start");
  }
}
