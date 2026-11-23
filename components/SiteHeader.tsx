"use client";

import Link from "next/link";
import { cartStore } from "@/lib/lab-state";
import { SITE } from "@/lib/site-config";

export function SiteHeader() {
  const cart = cartStore.useStore();
  const count = cart.lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {SITE.brand}<span className="text-accent">.</span>
          <span className="ml-2 rounded bg-[#f6ecd6] px-1.5 py-0.5 align-middle text-[10px] font-semibold tracking-wide text-[#7a5a12] uppercase">Demo</span>
        </Link>
        <nav className="order-last flex w-full flex-wrap gap-x-5 gap-y-1 text-sm text-muted sm:order-none sm:w-auto">
          <Link href="/" className="hover:text-foreground">Sản phẩm</Link>
          <Link href="/lab/guide" className="hover:text-foreground">Học GTM</Link>
          <Link href="/maps" className="hover:text-foreground">Showroom</Link>
          <Link href="/register" className="hover:text-foreground">Tài khoản</Link>
        </nav>
        <Link
          href="/cart"
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-[#f3efe9]"
        >
          Giỏ hàng
          <span className="min-w-6 rounded-full bg-accent px-1.5 text-center text-xs leading-5 text-accent-ink">
            {count}
          </span>
        </Link>
      </div>
    </header>
  );
}
