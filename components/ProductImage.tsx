import type { Product } from "@/lib/products";

export function ProductImage({ product, className = "" }: { product: Product; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{ background: product.color }}
      role="img"
      aria-label={product.name}
    >
      <span aria-hidden>{product.emoji}</span>
    </div>
  );
}
