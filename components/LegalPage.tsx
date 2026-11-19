import Link from "next/link";
import { SITE, missingSiteFields } from "@/lib/site-config";

const LINKS = [
  { href: "/privacy", label: "Chính sách bảo mật" },
  { href: "/cookies", label: "Chính sách cookie" },
  { href: "/terms", label: "Điều khoản sử dụng" },
];

export function LegalPage({ title, current, children }: { title: string; current: string; children: React.ReactNode }) {
  const missing = missingSiteFields();
  return (
    <article className="prose-lab mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={current === l.href ? "page" : undefined}
            className={`rounded-full px-3 py-1 ${current === l.href ? "bg-accent text-accent-ink" : "bg-[#efe9e0] text-muted hover:text-foreground"}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {missing.length > 0 && (
        <div className="mb-6 rounded-lg border border-[#d79a8a] bg-[#fbeeea] px-4 py-3 text-sm text-[#7a2e1c]">
          <b>Chưa sẵn sàng để publish:</b> hãy điền {missing.join(", ")} trong <code>lib/site-config.ts</code>. Chính sách
          không có người chịu trách nhiệm và kênh liên hệ thật thì không đáp ứng yêu cầu thông báo xử lý dữ liệu.
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">
        Áp dụng từ {SITE.effectiveDate} cho website {SITE.domain}.
      </p>
      {children}
    </article>
  );
}

export function DemoCallout() {
  return (
    <p className="mt-6 rounded-lg bg-[#f6ecd6] px-4 py-3 text-sm text-[#5c4410]">
      <b>{SITE.brand} là website DEMO</b> để học Google Tag Manager, Google Analytics và Google Ads. Website không bán hàng,
      không giao hàng, không thu tiền, không tạo ra hợp đồng mua bán. Sản phẩm, giá và đơn hàng đều là giả lập.
    </p>
  );
}
