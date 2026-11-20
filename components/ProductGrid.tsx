"use client";

import Link from "next/link";
import { PRODUCTS, formatVND, type Product } from "@/lib/products";
import { useTrackOnce } from "@/lib/hooks";
import { ProductImage } from "./ProductImage";
import { pushEcommerce, toItem } from "@/lib/dataLayer";

export function ProductGrid({
  listId,
  listName,
  products = PRODUCTS,
}: {
  listId: string;
  listName: string;
  products?: Product[];
}) {
  // Chạy 1 lần khi danh sách hiển thị (đã chặn việc React dev chạy effect 2 lần)
  useTrackOnce(listId, () => {
    // TODO Bài 4 — push event "view_item_list"
    //   item_list_id = listId, item_list_name = listName, items = danh sách `products`
    void listName;
    pushEcommerce("view_item_list", {
      item_list_id: listId,
      item_list_name: listName,
      items: products.map((p, index) => ({ ...toItem(p), index })),
    });
  });

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {products.map((p, index) => (
        <li key={p.id}>
          <Link
            href={`/products/${p.slug}`}
            onClick={() => {
              // TODO Bài 4 — push event "select_item" cho sản phẩm `p` (vị trí `index` trong danh sách)
              void index;
              pushEcommerce("select_item", {
                item_list_id: listId,
                item_list_name: listName,
                items: [{ ...toItem(p), index }],
              });
            }}
            className="group block"
          >
            <ProductImage
              product={p}
              className="aspect-[4/3] text-6xl transition-transform group-hover:scale-[1.02]"
            />
            <p className="mt-3 text-sm text-muted">{p.category}</p>
            <p className="font-medium leading-snug">{p.name}</p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">{formatVND(p.price)}</span>
              {p.compareAt && (
                <span className="ml-2 text-muted line-through">
                  {formatVND(p.compareAt)}
                </span>
              )}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
