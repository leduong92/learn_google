/**
 * Chạy TRƯỚC khi React hydrate → nơi lý tưởng để:
 *  1. Bắt gclid / utm_* từ URL landing (trước khi trang con bắn view_item)
 *  2. Đếm phiên (session_start)
 *  3. Bắn virtual_page_view cho lần load đầu và mỗi lần điều hướng client-side (SPA)
 *
 * Trong GTM: tạo trigger Custom Event = virtual_page_view nếu bạn muốn tự kiểm soát page_view
 * (thay vì dùng "Page changes based on browser history events" của GA4 Enhanced Measurement).
 */
import { attributionStore } from "./lib/lab-state";
import { captureAttribution, currentChannel, ensureSession, pushDL } from "./lib/tracking";

function pageViewPayload(path: string) {
  const last = attributionStore.get().last;
  return {
    event: "virtual_page_view",
    page_path: path,
    page_location: new URL(path, window.location.origin).href,
    traffic_channel: currentChannel(),
    gclid: last?.gclid,
  };
}

try {
  const touch = captureAttribution();
  ensureSession(touch);
  pushDL(pageViewPayload(window.location.pathname + window.location.search));
} catch (e) {
  console.warn("[lab] instrumentation lỗi", e);
}

export function onRouterTransitionStart(url: string) {
  try {
    pushDL(pageViewPayload(url));
  } catch {
    /* noop */
  }
}
