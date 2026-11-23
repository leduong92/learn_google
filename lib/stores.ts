/**
 * Showroom của cửa hàng demo — Bài 11 (quảng cáo Google Maps).
 * ĐỊA CHỈ VÀ SỐ ĐIỆN THOẠI LÀ MINH HOẠ: toạ độ đặt ở khu vực công cộng, số điện thoại không gọi được.
 * Website thật: thay bằng đúng địa chỉ đã xác minh trên Google Business Profile.
 */
export type Store = {
  /** Mã nội bộ — gắn vào data-store-id để GTM đọc */
  id: string;
  name: string;
  address: string;
  city: string;
  /** Hiển thị */
  phone: string;
  /** Dạng E.164 cho link tel: */
  phoneE164: string;
  hours: string;
  lat: number;
  lng: number;
};

export const STORES: Store[] = [
  {
    id: "hn-hoan-kiem",
    name: "Showroom Hà Nội",
    address: "Khu vực Hồ Hoàn Kiếm (địa chỉ minh hoạ)",
    city: "Hà Nội",
    phone: "0000 000 001",
    phoneE164: "+840000000001",
    hours: "9:00 – 21:00, thứ 2 – chủ nhật",
    lat: 21.0287,
    lng: 105.8524,
  },
  {
    id: "hcm-quan-1",
    name: "Showroom TP.HCM",
    address: "Khu vực Quận 1 (địa chỉ minh hoạ)",
    city: "TP. Hồ Chí Minh",
    phone: "0000 000 002",
    phoneE164: "+840000000002",
    hours: "9:00 – 21:30, thứ 2 – chủ nhật",
    lat: 10.7769,
    lng: 106.7009,
  },
];

/** Link “Chỉ đường” chuẩn của Google Maps (Maps URLs, không cần API key) */
export function directionsUrl(s: Store) {
  return `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
}

/** Bản đồ nhúng (iframe) — không cần API key */
export function embedUrl(s: Store) {
  return `https://www.google.com/maps?q=${s.lat},${s.lng}&z=16&hl=vi&output=embed`;
}
