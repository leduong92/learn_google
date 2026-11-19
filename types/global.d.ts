// Kiểu dữ liệu cho các biến toàn cục mà GTM / Google tag dùng.
// Nhờ file này, TypeScript cho phép bạn viết window.dataLayer.push(...) và gtag(...).
export {};

declare global {
  interface Window {
    /** Hàng đợi sự kiện mà GTM "nghe". Chưa nhúng GTM thì có thể là undefined. */
    dataLayer: unknown[];
    /** Hàm gtag() — tự định nghĩa trong snippet ở Bài 1 / Bài 7 */
    gtag: (...args: unknown[]) => void;
    /** GTM tự tạo object này khi container load thành công */
    google_tag_manager?: Record<string, unknown>;
  }
}
