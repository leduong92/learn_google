import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid gap-6 py-10 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="text-sm font-medium text-accent">Bộ sưu tập Thu Đông</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">Nội thất gỗ cho ngôi nhà chậm rãi.</h1>
          <p className="mt-4 max-w-lg text-muted">
            Cửa hàng giả lập để học tracking: xem sản phẩm → giỏ hàng → checkout → mua hàng. Nút{" "}
            <span className="font-mono text-foreground">dataLayer</span> ở góc phải cho bạn thấy những gì mình đã push.
          </p>
        </div>
        <div className="card p-5 text-sm">
          <p className="font-semibold">Bắt đầu học</p>
          <p className="mt-2 text-muted">
            Website chưa có tracking nào. Bạn sẽ tự nhúng GTM và tự viết từng sự kiện, theo 10 bài từ dễ đến khó.
          </p>
          <Link href="/lab/guide" className="btn-primary mt-4">Mở Bài 0 →</Link>
        </div>
      </section>

      <h2 className="mb-4 text-lg font-semibold">Sản phẩm nổi bật</h2>
      <ProductGrid listId="home_featured" listName="Trang chủ – Nổi bật" />
    </div>
  );
}
