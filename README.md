# Nhà Mộc — GTM & Google Ads Lab

Cửa hàng nội thất **giả lập** để học Google Tag Manager, GA4 ecommerce và Google Ads conversion tracking.
Đi trọn hành trình: click quảng cáo (gclid/UTM) → xem sản phẩm → giỏ hàng → checkout → purchase,
và quan sát từng `dataLayer.push`.

## Chạy

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Nhập GTM container ID ở **Cài đặt** (`/lab/settings`) hoặc đặt biến môi trường:

```bash
NEXT_GTM_ID=GTM-XXXXXXX npm run dev
```

## Có gì

| Trang                                                                  | Mục đích                                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `/` → `/products/[slug]` → `/cart` → `/checkout` → `/checkout/success` | Flow mua hàng, bắn đủ event GA4 ecommerce                                       |
| `/lab/ads`                                                             | Giả lập click Google Ads (gclid, UTM, auto-tagging), mô phỏng traffic hàng loạt |
| `/lab/funnel`                                                          | Phễu chuyển đổi theo chiến dịch, CPA, ROAS, POAS, gợi ý tối ưu                  |
| `/lab/guide`                                                           | Hướng dẫn từng bước cấu hình GTM → GA4 → Google Ads (tiếng Việt)                |
| `/lab/settings`                                                        | GTM ID, bật “lỗi tracking” để luyện debug, xoá dữ liệu                          |
| Nút `dataLayer` góc phải                                               | Xem mọi event realtime, cảnh báo lỗi dữ liệu ecommerce                          |

## Trước khi publish lên tên miền thật

1. Điền `operatorName`, `contactEmail`, `domain` trong `lib/site-config.ts` (các trang `/privacy`, `/cookies`, `/terms` báo đỏ nếu còn thiếu).
2. Giữ `noindex: true` — cửa hàng giả không nên xuất hiện trên Google Search.
3. Thêm tag mới trong GTM → cập nhật bảng cookie ở `app/cookies/page.tsx` và gắn consent cho tag.
4. Không chạy quảng cáo Google Ads thật có lời chào bán/giá/khuyến mại trỏ về site demo (rủi ro vi phạm chính sách Misrepresentation).

## Code tracking ở đâu

- `app/layout.tsx` — snippet GTM, khởi tạo `dataLayer`, Consent Mode v2 mặc định
- `instrumentation-client.ts` — bắt gclid/UTM khi landing, đếm phiên, `virtual_page_view`
- `lib/tracking.ts` — `trackEcommerce()`, chuẩn hoá item GA4, enhanced conversions (SHA-256)
- `lib/campaigns.ts` — chiến dịch giả lập (CPC, tỉ lệ chuyển đổi)

Toàn bộ dữ liệu lab (giỏ hàng, số liệu phễu, attribution) chỉ nằm trong localStorage của trình duyệt.
gclid là giả nên Google Ads sẽ không gán chuyển đổi — lab dùng để học cơ chế, cấu hình và debug.
