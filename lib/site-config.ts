/**
 * Thông tin người vận hành website — BẮT BUỘC điền trước khi publish.
 * Các trang Chính sách bảo mật / Điều khoản / Cookie đọc từ đây.
 * Giá trị bắt đầu bằng "[" được coi là CHƯA ĐIỀN và sẽ hiện cảnh báo đỏ trên các trang pháp lý.
 */
export const SITE = {
  /** Tên hiển thị. Nên kiểm tra không trùng nhãn hiệu đã đăng ký (tra cứu tại Cục Sở hữu trí tuệ). */
  brand: "Nhà Mộc",
  /** Họ tên cá nhân hoặc tên tổ chức chịu trách nhiệm về website & dữ liệu */
  operatorName: "[Họ tên / tên tổ chức vận hành]",
  /** Email nhận yêu cầu về dữ liệu cá nhân, khiếu nại */
  contactEmail: "[email-lien-he@ten-mien-cua-ban.vn]",
  /** Tên miền đã mua, không có https:// */
  domain: "[ten-mien-cua-ban.vn]",
  /** Ngày các chính sách bắt đầu áp dụng (dd/mm/yyyy) */
  effectiveDate: "19/11/2026",
  /**
   * true = chặn Google/Bing index (meta robots noindex).
   * Nên giữ true: cửa hàng giả không nên xuất hiện trên kết quả tìm kiếm.
   * AdsBot của Google Ads vẫn kiểm tra được trang đích.
   */
  noindex: true,
} as const;

export function isPlaceholder(v: string) {
  return v.trim().startsWith("[");
}

export function missingSiteFields() {
  return (["operatorName", "contactEmail", "domain"] as const).filter((k) => isPlaceholder(SITE[k]));
}
