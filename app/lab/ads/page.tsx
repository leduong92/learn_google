"use client";

import { useState } from "react";
import { CAMPAIGNS } from "@/lib/campaigns";
import { PRODUCTS, formatVND } from "@/lib/products";

const LANDINGS = [
  { path: "/", label: "Trang chủ" },
  { path: "/cart", label: "Giỏ hàng" },
  ...PRODUCTS.map((p) => ({ path: `/products/${p.slug}`, label: `SP: ${p.name}` })),
];

/** GCLID giả, trông giống thật (Cj0KCQ…). Google Ads sẽ không nhận mã này. */
function fakeGclid() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let s = "Cj0KCQiA";
  for (let i = 0; i < 72; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s + "_BwE";
}

export default function AdsLabPage() {
  const [campaignId, setCampaignId] = useState(CAMPAIGNS[0].id);
  const c = CAMPAIGNS.find((x) => x.id === campaignId)!;
  const [landing, setLanding] = useState<string | null>(null);
  const [adVariant, setAdVariant] = useState("rsa_a");
  const [autoTagging, setAutoTagging] = useState(true);
  const [useUtm, setUseUtm] = useState(true);

  const lp = landing ?? c.landing;

  function buildUrl(gclid: string) {
    const q = new URLSearchParams();
    if (useUtm) {
      q.set("utm_source", "google");
      q.set("utm_medium", "cpc");
      q.set("utm_campaign", c.id);
      if (c.keyword) q.set("utm_term", c.keyword);
      q.set("utm_content", adVariant);
    }
    if (autoTagging) q.set("gclid", gclid);
    const qs = q.toString();
    return qs ? `${lp}?${qs}` : lp;
  }

  const preview = buildUrl("Cj0KCQiA…_BwE");

  function click() {
    // Điều hướng full-page (giống click từ google.com) để GTM & instrumentation chạy như landing thật
    window.location.href = buildUrl(fakeGclid());
  }


  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">① Mô phỏng click quảng cáo Google Ads</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Khi người dùng click quảng cáo, Google (auto-tagging) gắn <code className="font-mono">gclid</code> vào URL đích.
        Tag <b>Conversion Linker</b> trong GTM lưu gclid vào cookie <code className="font-mono">_gcl_aw</code>, để khi
        purchase xảy ra, tag chuyển đổi Google Ads biết đơn hàng đến từ click nào.
      </p>

      <div className="mt-8 max-w-3xl">
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-2 font-semibold">Chiến dịch</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CAMPAIGNS.map((x) => (
                <label key={x.id} className={`card flex cursor-pointer gap-3 p-3 ${campaignId === x.id ? "border-accent ring-2 ring-accent/15" : ""}`}>
                  <input
                    type="radio"
                    name="campaign"
                    className="mt-1"
                    checked={campaignId === x.id}
                    onChange={() => {
                      setCampaignId(x.id);
                      setLanding(null);
                    }}
                  />
                  <span className="text-sm">
                    <span className="block font-medium">{x.name}</span>
                    <span className="block text-muted">
                      {x.type}
                      {x.keyword && <> · “{x.keyword}” ({x.matchType})</>} · CPC {formatVND(x.cpc)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">💡 {c.note}</p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lp" className="label">Trang đích (Final URL)</label>
              <select id="lp" className="field" value={lp} onChange={(e) => setLanding(e.target.value)}>
                {LANDINGS.map((l) => (
                  <option key={l.path} value={l.path}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ad" className="label">Mẫu quảng cáo (utm_content)</label>
              <select id="ad" className="field" value={adVariant} onChange={(e) => setAdVariant(e.target.value)}>
                <option value="rsa_a">RSA A – “Giảm đến 20%”</option>
                <option value="rsa_b">RSA B – “Miễn phí giao hàng”</option>
                <option value="rsa_c">RSA C – “Gỗ tự nhiên, bảo hành 5 năm”</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoTagging} onChange={(e) => setAutoTagging(e.target.checked)} />
              Auto-tagging (gắn gclid)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useUtm} onChange={(e) => setUseUtm(e.target.checked)} />
              Tracking template có UTM
            </label>
          </div>

          <div>
            <p className="label">URL người dùng sẽ landing</p>
            <pre className="overflow-x-auto rounded-lg bg-lab p-3 font-mono text-xs leading-6 text-lab-ink">
              {preview.split(/(?=[?&])/).map((part, i) => (
                <span key={i} className={i === 0 ? "text-[#9fd3a7]" : part.includes("gclid") ? "text-[#f5c26b]" : ""}>
                  {part}
                  {i > 0 && "\n"}
                </span>
              ))}
            </pre>
            {!autoTagging && (
              <p className="mt-2 text-sm text-[#9b3b25]">
                ⚠ Tắt auto-tagging = không có gclid → Google Ads khó ghi nhận chuyển đổi (chỉ còn dựa vào GA4 import / UTM).
              </p>
            )}
          </div>

          <button className="btn-primary px-6 py-3" onClick={click}>Click quảng cáo → landing</button>
          <p className="rounded-lg bg-[#fbeeea] px-4 py-3 text-sm text-[#7a2e1c]">
            ⚠ <b>Nếu chạy quảng cáo Google Ads thật trỏ về website này:</b> một cửa hàng không bán hàng có rủi ro bị Google đánh giá vi
            phạm chính sách <i>Misrepresentation</i> / <i>Unacceptable business practices</i> và khoá tài khoản. Nội dung quảng cáo
            phải nói rõ đây là demo/hướng dẫn, không dùng lời chào bán, giá hay khuyến mại (như các mẫu RSA ở trên) — chúng chỉ để mô
            phỏng. Không để quảng cáo của bạn gây hiểu nhầm cho người xem.
          </p>
        </div>

      </div>
    </div>
  );
}
