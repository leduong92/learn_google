import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PRODUCTS, getProduct } from "@/lib/products";
import { ProductDetail } from "./ProductDetail";
import { ProductGrid } from "@/components/ProductGrid";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  // Đọc params bên trong Suspense để điều hướng tức thì (Cache Components)
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Suspense fallback={<div className="aspect-[2/1] animate-pulse rounded-xl bg-[#efe9e0]" />}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <>
      <ProductDetail product={product} />
      <h2 className="mt-16 mb-4 text-lg font-semibold">Có thể bạn cũng thích</h2>
      <ProductGrid listId={`related_${product.id}`} listName="Sản phẩm liên quan" products={related} />
    </>
  );
}
