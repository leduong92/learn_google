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
            Cửa hàng giả lập để học tracking. Đi hết hành trình xem sản phẩm → giỏ hàng → checkout → mua hàng, và
            quan sát từng event trong nút <span className="font-mono text-foreground">dataLayer</span> ở góc phải.
          </p>
        </div>
        <div className="card p-5 text-sm">
          <p className="font-semibold">Bắt đầu học trong 3 bước</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>
              <Link href="/lab/settings" className="text-accent underline underline-offset-2">Nhập GTM container ID</Link>
            </li>
            <li>
              <Link href="/lab/ads" className="text-accent underline underline-offset-2">Giả lập 1 click quảng cáo</Link> rồi
              mua hàng
            </li>
            <li>
              <Link href="/lab/funnel" className="text-accent underline underline-offset-2">Xem phễu &amp; ROAS</Link> để tối ưu
            </li>
          </ol>
        </div>
      </section>

      <h2 className="mb-4 text-lg font-semibold">Sản phẩm nổi bật</h2>
      <ProductGrid listId="home_featured" listName="Trang chủ – Nổi bật" />
    </div>
  );
}
