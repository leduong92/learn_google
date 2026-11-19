"use client";

import { CAMPAIGNS, type Campaign } from "./campaigns";
import { PRODUCTS } from "./products";
import { emptyStats, statsStore, FUNNEL_STEPS, type ChannelStats } from "./lab-state";

/** GCLID giả, trông giống thật (Cj0KCQ…) */
export function fakeGclid() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let s = "Cj0KCQiA";
  for (let i = 0; i < 72; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "_BwE";
}

/**
 * Mô phỏng N click cho 1 chiến dịch: mỗi click đi qua phễu với xác suất `rates`.
 * Chỉ ghi vào số liệu phễu local (KHÔNG push dataLayer) để có đủ dữ liệu luyện tối ưu.
 */
export function simulateTraffic(c: Campaign, clicks: number, qualityBoost = 1) {
  const s: ChannelStats = emptyStats();
  for (let i = 0; i < clicks; i++) {
    s.clicks++;
    s.session_start++;
    for (const step of FUNNEL_STEPS.slice(1)) {
      const r = Math.min(0.98, c.rates[step as keyof Campaign["rates"]] * (step === "add_to_cart" ? qualityBoost : 1));
      if (Math.random() > r) break;
      s[step]++;
      if (step === "purchase") {
        const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
        const qty = Math.random() < 0.2 ? 2 : 1;
        s.revenue += p.price * qty;
      }
    }
  }
  statsStore.set((prev) => {
    const cur = { ...emptyStats(), ...(prev.byChannel[c.id] ?? {}) };
    for (const k of Object.keys(s) as (keyof ChannelStats)[]) cur[k] += s[k];
    return { byChannel: { ...prev.byChannel, [c.id]: cur } };
  });
  return s;
}

export function simulateAll(clicksEach: number) {
  for (const c of CAMPAIGNS) simulateTraffic(c, clicksEach);
}
