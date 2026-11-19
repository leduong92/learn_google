export type Product = {
  id: string; // item_id (SKU) — dùng cho GA4 & Dynamic Remarketing
  slug: string;
  name: string;
  brand: string;
  category: string;
  category2: string;
  price: number; // VND
  compareAt?: number;
  emoji: string;
  color: string; // màu nền ô ảnh
  variants: string[];
  description: string;
};

export const CURRENCY = "VND";

export const PRODUCTS: Product[] = [
  {
    id: "SKU-SOFA-001",
    slug: "sofa-bang-linen",
    name: "Sofa băng vải linen 3 chỗ",
    brand: "Nhà Mộc",
    category: "Phòng khách",
    category2: "Sofa",
    price: 18_900_000,
    compareAt: 22_500_000,
    emoji: "🛋️",
    color: "#e9e2d6",
    variants: ["Be", "Xám tro", "Xanh rêu"],
    description:
      "Khung gỗ sồi tự nhiên, nệm mút D40, vải linen chống bám bụi. Bảo hành khung 5 năm.",
  },
  {
    id: "SKU-TBL-014",
    slug: "ban-an-go-oc-cho",
    name: "Bàn ăn gỗ óc chó 6 ghế",
    brand: "Nhà Mộc",
    category: "Phòng ăn",
    category2: "Bàn ăn",
    price: 32_400_000,
    emoji: "🍽️",
    color: "#dcd0c0",
    variants: ["1m6", "1m8", "2m"],
    description:
      "Mặt bàn óc chó nguyên tấm, hoàn thiện dầu lau gốc thực vật, chân thép sơn tĩnh điện.",
  },
  {
    id: "SKU-CHR-031",
    slug: "ghe-thu-gian-boucle",
    name: "Ghế thư giãn bouclé",
    brand: "Lumen",
    category: "Phòng khách",
    category2: "Ghế",
    price: 7_450_000,
    compareAt: 8_900_000,
    emoji: "🪑",
    color: "#f1ece4",
    variants: ["Kem", "Nâu đất"],
    description: "Vải bouclé dày dặn, đế xoay 360°, phù hợp góc đọc sách.",
  },
  {
    id: "SKU-LMP-007",
    slug: "den-san-dong-thau",
    name: "Đèn sàn đồng thau",
    brand: "Lumen",
    category: "Chiếu sáng",
    category2: "Đèn sàn",
    price: 4_250_000,
    emoji: "🪔",
    color: "#efe3c8",
    variants: ["Đồng thau", "Đen mờ"],
    description: "Thân đồng thau đánh xước, chao vải, bóng LED E27 ánh sáng ấm 2700K.",
  },
  {
    id: "SKU-BED-002",
    slug: "giuong-ngu-boc-nem",
    name: "Giường ngủ bọc nệm đầu giường",
    brand: "Nhà Mộc",
    category: "Phòng ngủ",
    category2: "Giường",
    price: 15_600_000,
    emoji: "🛏️",
    color: "#e3e6e1",
    variants: ["1m6", "1m8"],
    description: "Đầu giường bọc nệm êm, khung gỗ tràm, có ngăn kéo chứa đồ.",
  },
  {
    id: "SKU-RUG-019",
    slug: "tham-len-thu-cong",
    name: "Thảm len dệt thủ công",
    brand: "Sợi Việt",
    category: "Trang trí",
    category2: "Thảm",
    price: 2_890_000,
    compareAt: 3_400_000,
    emoji: "🧶",
    color: "#ead9d3",
    variants: ["160x230", "200x300"],
    description: "Len New Zealand, dệt tay tại làng nghề, hoa văn hình học tối giản.",
  },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

export const SHIPPING_OPTIONS = [
  { id: "standard", label: "Giao tiêu chuẩn (3–5 ngày)", price: 0 },
  { id: "express", label: "Giao nhanh (24h, nội thành)", price: 350_000 },
  { id: "white_glove", label: "Giao + lắp đặt tận nơi", price: 790_000 },
] as const;

export const PAYMENT_OPTIONS = [
  { id: "cod", label: "Thanh toán khi nhận hàng (COD)" },
  { id: "bank_transfer", label: "Chuyển khoản ngân hàng" },
  { id: "credit_card", label: "Thẻ tín dụng (giả lập)" },
  { id: "ewallet", label: "Ví điện tử (giả lập)" },
] as const;

export const COUPONS: Record<string, number> = {
  // mã -> % giảm
  WELCOME10: 10,
  ADS15: 15,
};

export function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}
