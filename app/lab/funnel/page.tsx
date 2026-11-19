"use client";

import Link from "next/link";
import { useState } from "react";
import { getCampaign } from "@/lib/campaigns";
import { FUNNEL_STEPS, emptyStats, statsStore, type ChannelStats, type FunnelStep } from "@/lib/lab-state";
import { formatVND } from "@/lib/products";
import { simulateAll } from "@/lib/simulate";
import { useHydrated } from "@/lib/hooks";

const STEP_LABEL: Record<FunnelStep, string> = {
  session_start: "Phiên",
  view_item: "Xem SP",
  add_to_cart: "Thêm giỏ",
  begin_checkout: "Checkout",
  add_shipping_info: "Ship info",
  add_payment_info: "Payment",
  purchase: "Mua",
};

const STEP_ADVICE: Partial<Record<FunnelStep, string>> = {
  view_item: "Landing page chưa dẫn tới sản phẩm: kiểm tra Final URL có đúng trang sản phẩm không, tốc độ tải trang, mức liên quan giữa từ khoá → quảng cáo → trang đích.",
  add_to_cart: "Trang sản phẩm chưa thuyết phục: giá, ảnh, đánh giá, chính sách đổi trả. Có thể tạo audience “view_item nhưng không add_to_cart” để remarketing.",
  begin_checkout: "Bỏ giỏ hàng: phí ship bất ngờ, thiếu coupon. Tạo audience “add_to_cart 7 ngày, chưa purchase” cho Display/PMax remarketing.",
  add_shipping_info: "Form giao hàng gây ma sát: giảm số trường, autofill, cho phép mua không cần tài khoản.",
  add_payment_info: "Người dùng ngập ngừng ở bước thanh toán: phương thức thanh toán chưa đủ, chưa hiện rõ tổng tiền.",
  purchase: "Rớt ở bước cuối: lỗi cổng thanh toán, hoặc… tracking purchase bị lỗi! Kiểm tra trong GTM Preview trước.",
};

type Row = ChannelStats & { channel: string; cost: number };

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");

export default function FunnelPage() {
  const hydrated = useHydrated();
  const stats = statsStore.useStore();
  const [targetRoas, setTargetRoas] = useState(1500); // %
  const [margin, setMargin] = useState(35); // % biên lợi nhuận gộp
  const [selected, setSelected] = useState<string>("__all");

  const rows: Row[] = Object.entries(stats.byChannel)
    .map(([channel, s]) => {
      const camp = getCampaign(channel);
      return { channel, ...emptyStats(), ...s, cost: camp ? s.clicks * camp.cpc : 0 };
    })
    .sort((a, b) => b.cost - a.cost || b.session_start - a.session_start);

  const total: Row = rows.reduce(
    (acc, r) => {
      for (const k of Object.keys(emptyStats()) as (keyof ChannelStats)[]) acc[k] += r[k];
      acc.cost += r.cost;
      return acc;
    },
    { channel: "Tổng", ...emptyStats(), cost: 0 } as Row,
  );

  const focus = selected === "__all" ? total : rows.find((r) => r.channel === selected) ?? total;

  // Bước rớt nhiều nhất của phễu đang xem
  let worst: { step: FunnelStep; rate: number } | null = null;
  for (let i = 1; i < FUNNEL_STEPS.length; i++) {
    const prev = focus[FUNNEL_STEPS[i - 1]];
    if (prev < 10) continue;
    const rate = focus[FUNNEL_STEPS[i]] / prev;
    if (!worst || rate < worst.rate) worst = { step: FUNNEL_STEPS[i], rate };
  }

  const insights: string[] = [];
  for (const r of rows) {
    if (!getCampaign(r.channel) || r.clicks < 30) continue;
    if (r.purchase < 15) {
      insights.push(`“${r.channel}”: mới có ${r.purchase} đơn — quá ít để kết luận (ROAS dao động mạnh). Đợi thêm dữ liệu trước khi đổi bid/ngân sách.`);
      continue;
    }
    const roas = r.cost ? (r.revenue / r.cost) * 100 : 0;
    const poas = r.cost ? ((r.revenue * margin) / 100 / r.cost) * 100 : 0;
    if (roas < targetRoas)
      insights.push(`“${r.channel}”: ROAS ${roas.toFixed(0)}% < mục tiêu ${targetRoas}%. Xem search terms, thêm từ khoá phủ định, hạ tCPA/tăng tROAS, hoặc đổi landing page.`);
    else if (roas > targetRoas * 1.5)
      insights.push(`“${r.channel}”: ROAS ${roas.toFixed(0)}% vượt xa mục tiêu → cân nhắc tăng ngân sách (có thể đang bị giới hạn ngân sách).${
        r.channel === "search_brand" ? " Riêng chiến dịch thương hiệu: kiểm tra tính gia tăng (incrementality) — nhiều đơn có thể vẫn đến dù không chạy Ads." : ""
      }`);
    if (poas < 100 && r.cost > 0)
      insights.push(`“${r.channel}”: sau biên lợi nhuận ${margin}%, POAS ${poas.toFixed(0)}% < 100% → đang lỗ trên mỗi đồng quảng cáo dù ROAS trông ổn.`);
  }
  if (stats.byChannel["(google ads – thiếu utm)"])
    insights.push("Có traffic có gclid nhưng thiếu utm_campaign → GA4 vẫn nhận diện nhờ liên kết Ads, nhưng báo cáo nội bộ khó phân tích. Thêm tracking template ở cấp tài khoản.");

  const maxStep = Math.max(1, focus.session_start);

  if (!hydrated) return <div className="mx-auto max-w-6xl px-4 py-10 text-muted">Đang tải…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">② Phễu chuyển đổi &amp; ROAS</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Số liệu đếm local từ chính các event bạn tạo (và traffic mô phỏng). Chi phí = clicks × CPC giả định của chiến dịch.
            Trong thực tế bạn sẽ xem các số này ở Google Ads (Conversions) và GA4 (Explore → Funnel).
          </p>
        </div>
        <button className="btn-ghost" onClick={() => simulateAll(500)}>+500 click mỗi chiến dịch</button>
        <button
          className="btn-ghost"
          onClick={() => {
            if (window.confirm("Xoá toàn bộ số liệu phễu?")) statsStore.set({ byChannel: {} });
          }}
        >
          Xoá số liệu
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="font-semibold">Chưa có dữ liệu</p>
          <p className="mt-1 text-sm text-muted">Đi một vòng mua hàng, hoặc chạy mô phỏng traffic.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/lab/ads" className="btn-primary">Giả lập click Ads</Link>
            <button className="btn-ghost" onClick={() => simulateAll(200)}>Mô phỏng nhanh</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              Target ROAS
              <input type="number" className="field w-24" step={50} value={targetRoas} onChange={(e) => setTargetRoas(Number(e.target.value) || 0)} />%
            </label>
            <label className="flex items-center gap-2">
              Biên lợi nhuận gộp
              <input type="number" className="field w-20" value={margin} onChange={(e) => setMargin(Number(e.target.value) || 0)} />%
            </label>
          </div>

          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-[#f3efe9] text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2">Kênh / chiến dịch</th>
                  <th className="px-3 py-2 text-right">Click</th>
                  <th className="px-3 py-2 text-right">Chi phí</th>
                  {FUNNEL_STEPS.map((s) => (
                    <th key={s} className="px-3 py-2 text-right">{STEP_LABEL[s]}</th>
                  ))}
                  <th className="px-3 py-2 text-right">CR</th>
                  <th className="px-3 py-2 text-right">Doanh thu</th>
                  <th className="px-3 py-2 text-right">CPA</th>
                  <th className="px-3 py-2 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {[...rows, total].map((r) => {
                  const roas = r.cost ? (r.revenue / r.cost) * 100 : null;
                  const isTotal = r === total;
                  return (
                    <tr
                      key={r.channel}
                      onClick={() => setSelected(isTotal ? "__all" : r.channel)}
                      className={`cursor-pointer border-t border-line tabular-nums hover:bg-[#faf6f0] ${isTotal ? "font-semibold" : ""} ${
                        (selected === r.channel || (isTotal && selected === "__all")) ? "bg-[#eef3ee]" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{r.channel}</td>
                      <td className="px-3 py-2 text-right">{r.clicks}</td>
                      <td className="px-3 py-2 text-right">{r.cost ? formatVND(r.cost) : "—"}</td>
                      {FUNNEL_STEPS.map((s) => (
                        <td key={s} className="px-3 py-2 text-right">{r[s]}</td>
                      ))}
                      <td className="px-3 py-2 text-right">{pct(r.purchase, r.session_start)}</td>
                      <td className="px-3 py-2 text-right">{formatVND(r.revenue)}</td>
                      <td className="px-3 py-2 text-right">{r.cost && r.purchase ? formatVND(r.cost / r.purchase) : "—"}</td>
                      <td className={`px-3 py-2 text-right ${roas !== null && roas < targetRoas ? "text-[#b4442b]" : "text-accent"}`}>
                        {roas === null ? "—" : `${roas.toFixed(0)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Bấm vào một dòng để xem phễu chi tiết. Leads (generate_lead): {total.leads}.</p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <section>
              <h2 className="font-semibold">
                Phễu: <span className="font-mono text-sm">{selected === "__all" ? "Tổng" : selected}</span>
              </h2>
              <ol className="mt-3 space-y-2">
                {FUNNEL_STEPS.map((s, i) => {
                  const v = focus[s];
                  const prev = i > 0 ? focus[FUNNEL_STEPS[i - 1]] : null;
                  return (
                    <li key={s} className="grid grid-cols-[90px_1fr_70px] items-center gap-3 text-sm">
                      <span className="text-muted">{STEP_LABEL[s]}</span>
                      <span className="h-6 rounded bg-[#efe9e0]">
                        <span
                          className={`block h-6 rounded ${worst?.step === s ? "bg-[#d0795f]" : "bg-accent"}`}
                          style={{ width: `${(v / maxStep) * 100}%` }}
                        />
                      </span>
                      <span className="text-right tabular-nums">
                        {v}
                        {prev !== null && <span className="block text-[11px] text-muted">{pct(v, prev)}</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section>
              <h2 className="font-semibold">Gợi ý tối ưu</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {worst && STEP_ADVICE[worst.step] && (
                  <li className="rounded-lg bg-[#fbeeea] px-4 py-3">
                    <b>Rớt nhiều nhất trước bước “{STEP_LABEL[worst.step]}”</b> (chỉ {(worst.rate * 100).toFixed(1)}% đi tiếp).{" "}
                    {STEP_ADVICE[worst.step]}
                  </li>
                )}
                {insights.map((t) => (
                  <li key={t} className="rounded-lg bg-[#f3efe9] px-4 py-3">{t}</li>
                ))}
                {!worst && insights.length === 0 && <li className="text-muted">Cần thêm dữ liệu (≥ 30 click/chiến dịch) để đưa gợi ý.</li>}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
