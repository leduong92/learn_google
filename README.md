# Nhà Mộc — Học GTM & Google Ads từ đầu

Cửa hàng nội thất **giả lập**, **chưa có tracking**. Bạn tự nhúng Google Tag Manager, tự viết từng `dataLayer.push`
và tự cấu hình GTM → GA4 → Google Ads, theo 10 bài ở `/lab/guide`.

- Nhánh `hoc-tu-dau`: bản để học (có các chỗ `TODO Bài X` trong code).
- Nhánh `dev`: **đáp án** — bản đã làm đầy đủ. Xem một file: `git show dev:đường/dẫn/file`.

## Chạy

```bash
npm install
npm run dev
```

Mở http://localhost:3000/lab/guide và bắt đầu từ Bài 0. Tìm chỗ cần viết code: tìm `TODO Bài` trong project.

## Có gì

| Trang | Mục đích |
| --- | --- |
| `/` → `/products/[slug]` → `/cart` → `/checkout` → `/checkout/status/[order]` | Flow mua hàng — nơi bạn gắn các event |
| `/lab/guide` | 10 bài học từng bước (code + GTM + cách kiểm tra) |
| `/lab/ads` | Tạo URL click quảng cáo giả (gclid, UTM) để thử Conversion Linker |
| Nút `dataLayer` góc phải | Xem nội dung `window.dataLayer`, cảnh báo lỗi dữ liệu ecommerce |

## Trước khi publish lên tên miền thật

1. Điền `operatorName`, `contactEmail`, `domain` trong `lib/site-config.ts` (các trang `/privacy`, `/cookies`, `/terms` báo đỏ nếu còn thiếu).
2. Giữ `noindex: true` — cửa hàng giả không nên xuất hiện trên Google Search.
3. Thêm tag mới trong GTM → cập nhật bảng cookie ở `app/cookies/page.tsx` và gắn consent cho tag.
4. Không chạy quảng cáo Google Ads thật có lời chào bán/giá/khuyến mại trỏ về site demo (rủi ro vi phạm chính sách Misrepresentation).
