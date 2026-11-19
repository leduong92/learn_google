/**
 * Các chiến dịch Google Ads GIẢ LẬP. Dùng ở trang Ads Lab để tạo URL click quảng cáo
 * và ở trang Phễu để tính chi phí (clicks × CPC) → CPA, ROAS.
 *
 * `rates` = xác suất đi tiếp mỗi bước khi chạy "mô phỏng traffic" —
 * mô tả chất lượng traffic khác nhau giữa các loại chiến dịch.
 */
export type Campaign = {
  id: string; // utm_campaign
  name: string;
  type: "Search" | "Performance Max" | "Display" | "Shopping";
  keyword?: string;
  matchType?: "Exact" | "Phrase" | "Broad";
  adGroup: string;
  cpc: number; // VND / click
  landing: string; // đường dẫn trang đích mặc định
  rates: {
    view_item: number;
    add_to_cart: number;
    begin_checkout: number;
    add_shipping_info: number;
    add_payment_info: number;
    purchase: number;
  };
  note: string;
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: "search_brand",
    name: "Search | Thương hiệu",
    type: "Search",
    keyword: "nhà mộc sofa",
    matchType: "Exact",
    adGroup: "brand_core",
    cpc: 4_000,
    landing: "/",
    rates: { view_item: 0.85, add_to_cart: 0.12, begin_checkout: 0.6, add_shipping_info: 0.85, add_payment_info: 0.85, purchase: 0.75 },
    note: "CPC rẻ, ý định mua cao. Nhưng nhiều người đã biết thương hiệu — liệu không chạy họ có tự tìm đến?",
  },
  {
    id: "search_generic_sofa",
    name: "Search | Sofa (generic)",
    type: "Search",
    keyword: "mua sofa vải",
    matchType: "Phrase",
    adGroup: "sofa_generic",
    cpc: 22_000,
    landing: "/products/sofa-bang-linen",
    rates: { view_item: 0.7, add_to_cart: 0.08, begin_checkout: 0.5, add_shipping_info: 0.8, add_payment_info: 0.8, purchase: 0.7 },
    note: "CPC đắt, cạnh tranh cao. Tối ưu bằng từ khoá phủ định, landing page đúng sản phẩm.",
  },
  {
    id: "pmax_all_products",
    name: "PMax | Toàn bộ sản phẩm",
    type: "Performance Max",
    adGroup: "asset_group_all",
    cpc: 12_000,
    landing: "/",
    rates: { view_item: 0.65, add_to_cart: 0.08, begin_checkout: 0.5, add_shipping_info: 0.8, add_payment_info: 0.8, purchase: 0.7 },
    note: "Phụ thuộc mạnh vào dữ liệu chuyển đổi chính xác (giá trị, enhanced conversions) để tự tối ưu.",
  },
  {
    id: "shopping_chairs",
    name: "Shopping | Ghế & đèn",
    type: "Shopping",
    adGroup: "chairs_lamps",
    cpc: 9_000,
    landing: "/products/ghe-thu-gian-boucle",
    rates: { view_item: 0.9, add_to_cart: 0.12, begin_checkout: 0.55, add_shipping_info: 0.8, add_payment_info: 0.85, purchase: 0.75 },
    note: "Người dùng đã thấy giá & ảnh trước khi click → tỉ lệ xem sản phẩm cao.",
  },
  {
    id: "display_remarketing",
    name: "Display | Remarketing giỏ hàng",
    type: "Display",
    adGroup: "cart_abandoners_30d",
    cpc: 7_000,
    landing: "/cart",
    rates: { view_item: 0.5, add_to_cart: 0.18, begin_checkout: 0.45, add_shipping_info: 0.8, add_payment_info: 0.8, purchase: 0.7 },
    note: "Audience lấy từ sự kiện add_to_cart/begin_checkout. Cần tag remarketing + consent ad_personalization.",
  },
];

export function getCampaign(id: string | undefined | null) {
  return CAMPAIGNS.find((c) => c.id === id);
}
