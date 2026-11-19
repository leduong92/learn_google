import Link from "next/link";

/** Dải thông báo luôn hiển thị: tránh người dùng hiểu nhầm đây là cửa hàng thật */
export function DemoNotice() {
  return (
    <div className="bg-[#f6ecd6] text-[#5c4410]">
      <p className="mx-auto max-w-6xl px-4 py-1.5 text-center text-xs">
        <b>Website DEMO để học tracking</b> — không bán hàng, không giao hàng, không thu tiền. Đừng nhập thông tin thật.{" "}
        <Link href="/terms" className="underline underline-offset-2">Điều khoản</Link>
      </p>
    </div>
  );
}
