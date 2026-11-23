import Link from "next/link";
import { SITE } from "@/lib/site-config";
import { StoreMap } from "./StoreMap";

export const metadata = { title: `Showroom — ${SITE.brand}` };

export default function MapsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Ghé showroom {SITE.brand}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Ngồi thử sofa, sờ mặt gỗ trước khi mua. Chọn showroom gần bạn, bấm <b>Chỉ đường</b> để mở Google Maps hoặc{" "}
        <b>Gọi</b> để đặt lịch xem hàng.
      </p>
      <p className="mt-3 max-w-2xl rounded-lg bg-[#f6ecd6] px-3 py-2 text-sm text-[#5c4410]">
        Demo — <b>địa chỉ và số điện thoại là minh hoạ</b>, không có showroom thật. Trang này để luyện đo click “Chỉ đường” / “Gọi”
        ở{" "}
        <Link href="/lab/guide#bai-11" className="underline">
          Bài 11
        </Link>
        .
      </p>
      <StoreMap />
    </div>
  );
}
