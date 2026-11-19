import Link from "next/link";

export const metadata = { title: "Hướng dẫn GTM & Google Ads — Lab" };

const ECOM_REGEX =
  "^(view_item_list|select_item|view_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|add_shipping_info|add_payment_info|purchase)$";

const EVENTS: [string, string, string][] = [
  ["virtual_page_view", "Mỗi lần load trang và mỗi lần điều hướng client-side", "page_path, page_location, traffic_channel, gclid"],
  ["view_item_list", "Danh sách sản phẩm hiển thị (trang chủ, “có thể bạn thích”)", "item_list_id, item_list_name, items[]"],
  ["select_item", "Click 1 sản phẩm trong danh sách", "item_list_id, items[1]"],
  ["view_item", "Mở trang chi tiết sản phẩm", "value, currency, items[1]"],
  ["add_to_cart", "Bấm “Thêm vào giỏ” hoặc nút + trong giỏ", "value, currency, items[]"],
  ["remove_from_cart", "Nút − / Xoá trong giỏ", "value, currency, items[]"],
  ["view_cart", "Mở trang giỏ hàng (có hàng)", "value, currency, items[]"],
  ["begin_checkout", "Vào trang checkout", "value, coupon, items[]"],
  ["add_shipping_info", "Gửi form địa chỉ + chọn cách giao", "shipping_tier, value, items[]"],
  ["add_payment_info", "Bấm Đặt hàng (đã chọn thanh toán)", "payment_type, value, items[]"],
  ["purchase", "Trang cảm ơn (chỉ 1 lần/đơn)", "transaction_id, value, tax, shipping, coupon, items[], new_customer, user_data (chỉ khi được đồng ý)"],
  ["generate_lead", "Đăng ký email ở footer", "value, currency, user_data_sha256 (chỉ khi ad_user_data = granted)"],
  ["consent_update", "Người dùng chọn trên banner cookie", "consent_state"],
];

export default function GuidePage() {
  return (
    <article className="prose-lab mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">③ Hướng dẫn: GTM → GA4 → Google Ads</h1>
      <p className="mt-3 text-muted">
        Lộ trình thực hành trên chính cửa hàng này. Làm theo thứ tự; mỗi bước đều kiểm tra được trong <b>GTM Preview</b> và nút{" "}
        <code>dataLayer</code> ở góc phải màn hình.
      </p>

      <h2>0. Bức tranh tổng thể</h2>
      <pre>{`Website (app này)
  │  dataLayer.push({ event: 'purchase', ecommerce: {...}, user_data: {...} })
  ▼
Google Tag Manager  ── Trigger: "Custom Event = purchase"
  │                    Variables: {{DLV - ecommerce.value}}, {{DLV - transaction_id}} ...
  ├─► Tag GA4 Event (purchase)          → GA4: báo cáo, phễu, audience
  ├─► Tag Google Ads Conversion         → Google Ads: chuyển đổi, Smart Bidding
  ├─► Tag Conversion Linker (All Pages) → lưu gclid vào cookie _gcl_aw
  └─► Tag Google Ads Remarketing        → danh sách remarketing`}</pre>
      <p>
        Nguyên tắc vàng: <b>website chỉ mô tả “chuyện gì đã xảy ra” vào dataLayer</b>; còn gửi đi đâu, gửi gì là việc của GTM.
        Nhờ vậy marketer tự thêm/sửa tag mà không cần dev.
      </p>

      <h2>1. Chuẩn bị tài khoản</h2>
      <ol>
        <li><b>GTM</b>: tạo container loại Web → lấy ID <code>GTM-XXXXXXX</code>.</li>
        <li><b>GA4</b>: tạo property riêng để học (đừng dùng property thật) → Data stream Web → lấy Measurement ID <code>G-XXXXXXX</code>.</li>
        <li>
          <b>Google Ads</b>: Goals → Conversions → New → Website → tạo hành động “Purchase” (cài thủ công bằng GTM) → lấy{" "}
          <code>Conversion ID</code> (dạng AW-123456789, trong GTM chỉ nhập phần số) và <code>Conversion Label</code>.
        </li>
        <li>Liên kết GA4 ↔ Google Ads (GA4 Admin → Product links) để chia sẻ audience &amp; import chuyển đổi nếu cần.</li>
      </ol>
      <p className="rounded-lg bg-[#f6ecd6] px-4 py-3 text-sm">
        ⚠ <b>Lưu ý</b>: gclid trong lab là giả. Google Ads sẽ <b>không</b> gán chuyển đổi cho click giả — lab giúp bạn học đúng cơ chế,
        cấu hình và debug. Số liệu chi phí/ROAS thật bạn xem trong tài khoản Ads khi chạy trên website thật.
      </p>

      <h2>2. Cài GTM vào lab &amp; bật Preview</h2>
      <ol>
        <li>Vào <Link href="/lab/settings" className="text-accent underline">Cài đặt</Link>, dán GTM ID → Lưu. Thanh lab trên cùng sẽ báo “● đã load”.</li>
        <li>Trong GTM bấm <b>Preview</b> → nhập <code>http://localhost:3000</code> → Connect. Tag Assistant mở tab mới đã kết nối.</li>
        <li>Trong cửa sổ Tag Assistant, mỗi event ở cột trái tương ứng với 1 lần <code>dataLayer.push</code>. Bấm vào để xem tab <b>Tags</b>, <b>Variables</b>, <b>Data Layer</b>.</li>
      </ol>

      <h2>3. Tạo Variables</h2>
      <p>Variables → User-Defined → New → <b>Data Layer Variable</b> (Version 2):</p>
      <table>
        <thead>
          <tr><th>Tên biến (gợi ý)</th><th>Data Layer Variable Name</th></tr>
        </thead>
        <tbody>
          <tr><td>DLV - ecommerce.value</td><td><code>ecommerce.value</code></td></tr>
          <tr><td>DLV - ecommerce.currency</td><td><code>ecommerce.currency</code></td></tr>
          <tr><td>DLV - ecommerce.transaction_id</td><td><code>ecommerce.transaction_id</code></td></tr>
          <tr><td>DLV - ecommerce.items</td><td><code>ecommerce.items</code></td></tr>
          <tr><td>DLV - user_data.email</td><td><code>user_data.email</code></td></tr>
          <tr><td>DLV - user_data.phone_number</td><td><code>user_data.phone_number</code></td></tr>
          <tr><td>DLV - new_customer</td><td><code>new_customer</code></td></tr>
          <tr><td>DLV - page_location</td><td><code>page_location</code></td></tr>
        </tbody>
      </table>
      <p>Bật thêm Built-in Variables: <code>Event</code>, <code>Page Path</code>, <code>Page URL</code>.</p>

      <h2>4. Tạo Triggers</h2>
      <table>
        <thead>
          <tr><th>Tên</th><th>Loại</th><th>Cấu hình</th></tr>
        </thead>
        <tbody>
          <tr><td>CE - ecommerce</td><td>Custom Event</td><td>Event name: <code>{ECOM_REGEX}</code> — tick “Use regex matching”</td></tr>
          <tr><td>CE - purchase</td><td>Custom Event</td><td><code>purchase</code></td></tr>
          <tr><td>CE - generate_lead</td><td>Custom Event</td><td><code>generate_lead</code></td></tr>
          <tr><td>CE - virtual_page_view</td><td>Custom Event</td><td><code>virtual_page_view</code></td></tr>
        </tbody>
      </table>

      <h2>5. Tag GA4</h2>
      <h3>5.1 Google tag (cấu hình)</h3>
      <ul>
        <li>Tag type: <b>Google Tag</b>, Tag ID: <code>G-XXXXXXX</code>, trigger: <b>Initialization - All Pages</b>.</li>
        <li>
          Page view cho app một trang (SPA) — chọn <b>một</b> trong hai cách, không dùng cả hai (sẽ đếm trùng):
          <ul>
            <li><b>Cách A (đơn giản)</b>: giữ mặc định, bật Enhanced Measurement → “Page changes based on browser history events” trong GA4.</li>
            <li>
              <b>Cách B (kiểm soát)</b>: trong Google tag thêm Configuration parameter <code>send_page_view = false</code>, tắt mục history ở
              Enhanced Measurement, rồi tạo GA4 Event tag tên <code>page_view</code> với tham số <code>page_location</code> ={" "}
              <code>{"{{DLV - page_location}}"}</code>, trigger <b>CE - virtual_page_view</b>.
            </li>
          </ul>
        </li>
      </ul>
      <h3>5.2 GA4 Event – toàn bộ ecommerce bằng 1 tag</h3>
      <ul>
        <li>Tag type: <b>Google Analytics: GA4 Event</b>, Measurement ID: <code>G-XXXXXXX</code>.</li>
        <li>Event Name: <code>{"{{Event}}"}</code> (lấy luôn tên event từ dataLayer).</li>
        <li>More Settings → Ecommerce → tick <b>Send Ecommerce data</b>, Data source: <b>Data Layer</b>.</li>
        <li>Trigger: <b>CE - ecommerce</b>.</li>
      </ul>
      <p>
        Kiểm tra: GA4 → Admin → <b>DebugView</b> (Tag Assistant tự bật debug mode). Đi một vòng mua hàng, thấy đủ 10 event với items là đạt.
      </p>

      <h2>6. Tag Google Ads</h2>
      <h3>6.1 Conversion Linker</h3>
      <p>
        Tag type <b>Conversion Linker</b>, trigger <b>All Pages</b>. Nó đọc <code>gclid</code> trên URL landing và lưu cookie{" "}
        <code>_gcl_aw</code>. Thử: vào <Link href="/lab/ads" className="text-accent underline">Ads Lab</Link>, click quảng cáo, rồi mở DevTools →
        Application → Cookies (khi đã đồng ý <code>ad_storage</code>).
      </p>
      <h3>6.2 Google Ads Conversion Tracking – Purchase</h3>
      <ul>
        <li>Conversion ID / Conversion Label: từ bước 1.</li>
        <li>Conversion Value: <code>{"{{DLV - ecommerce.value}}"}</code></li>
        <li>Transaction ID: <code>{"{{DLV - ecommerce.transaction_id}}"}</code> — giúp Ads loại bỏ chuyển đổi trùng.</li>
        <li>Currency Code: <code>{"{{DLV - ecommerce.currency}}"}</code></li>
        <li>Trigger: <b>CE - purchase</b>.</li>
      </ul>
      <h3>6.3 Enhanced Conversions (chuyển đổi nâng cao)</h3>
      <ol>
        <li>Trong Google Ads: Goals → Settings → bật <b>Enhanced conversions for web</b>, phương thức <b>Google Tag Manager</b>.</li>
        <li>Trong tag Purchase ở trên: tick <b>Include user-provided data from your website</b> → New Variable → <b>User-Provided Data</b> → Manual configuration:
          Email = <code>{"{{DLV - user_data.email}}"}</code>, Phone = <code>{"{{DLV - user_data.phone_number}}"}</code> (địa chỉ tương tự với <code>user_data.address.*</code>).</li>
        <li>GTM tự chuẩn hoá &amp; hash SHA-256 trước khi gửi. App cũng push sẵn bản đã hash ở <code>user_data_sha256</code> để bạn so sánh.</li>
        <li>
          <b>Quan trọng (pháp lý):</b> app chỉ push <code>user_data</code> khi người dùng tích ô đồng ý riêng ở checkout <b>và</b> đã cho phép{" "}
          <code>ad_user_data</code>. Event purchase có cờ <code>enhanced_conversions_allowed</code> để bạn kiểm tra. Hãy giữ nguyên nguyên tắc
          này khi làm cho website thật.
        </li>
      </ol>
      <h3>6.4 Khách hàng mới (Customer acquisition)</h3>
      <p>
        Trong tag Purchase, phần <b>Provide new customer data</b> → New customer: <code>{"{{DLV - new_customer}}"}</code>. Đặt cùng email 2 lần để
        thấy giá trị chuyển từ <code>true</code> sang <code>false</code>.
      </p>
      <h3>6.5 Remarketing</h3>
      <ul>
        <li>Tag type <b>Google Ads Remarketing</b>, Conversion ID như trên, trigger <b>CE - ecommerce</b>.</li>
        <li>Bật <b>Send dynamic remarketing event data</b>: Event Value <code>{"{{DLV - ecommerce.value}}"}</code>, Event Items <code>{"{{DLV - ecommerce.items}}"}</code>.</li>
        <li>Mỗi item có sẵn <code>google_business_vertical: &apos;retail&apos;</code>; ID sản phẩm phải khớp ID trong feed Merchant Center thì quảng cáo động mới hiển thị đúng. Kiểm tra ở Google Ads → Audience manager → Your data sources.</li>
        <li>Ý tưởng audience: “add_to_cart trong 7 ngày nhưng không purchase” → dùng cho chiến dịch <i>Display | Remarketing giỏ hàng</i>.</li>
      </ul>
      <h3>6.6 Chuyển đổi phụ</h3>
      <p>
        Tạo thêm tag Ads Conversion cho <b>CE - generate_lead</b>, đặt nó là <b>Secondary</b> trong Google Ads để quan sát mà không làm lệch Smart
        Bidding tối ưu theo doanh thu.
      </p>

      <h2>7. Consent Mode v2</h2>
      <ul>
        <li>App đã gọi <code>gtag(&apos;consent&apos;,&apos;default&apos;, …denied)</code> trước khi GTM load, và <code>gtag(&apos;consent&apos;,&apos;update&apos;)</code> khi bấm banner.</li>
        <li>GTM Admin → Container Settings → bật <b>Enable consent overview</b>. Tag Google có “built-in consent checks”; tag bên thứ 3 cần đặt “Require additional consent”.</li>
        <li>Thử “Từ chối tất cả”: trong Preview, tab <b>Consent</b> cho thấy trạng thái; tag Google vẫn fire nhưng gửi ping không cookie (thấy <code>gcs=G100</code> trong request).</li>
        <li>Mở lại banner bằng link “Cài đặt cookie” ở footer.</li>
      </ul>

      <h2>8. Debug &amp; checklist trước khi Publish</h2>
      <ul>
        <li>Mỗi event ecommerce: <code>value</code> là <b>số</b>, có <code>currency</code>, <code>items</code> không rỗng.</li>
        <li>Purchase có <code>transaction_id</code>, chỉ fire 1 lần — reload trang cảm ơn không bắn lại.</li>
        <li>Tag Ads Purchase fire đúng 1 lần ở event purchase, không fire ở các event khác.</li>
        <li>Conversion Linker fire ở mọi trang; cookie <code>_gcl_aw</code> tồn tại sau khi landing có gclid.</li>
        <li>Đã đặt tên version rõ ràng khi Submit (vd. “v3 – thêm enhanced conversions”).</li>
      </ul>

      <h2>9. Trước khi publish lên tên miền thật</h2>
      <ul>
        <li>Điền người vận hành, email liên hệ, tên miền trong <code>lib/site-config.ts</code> — các trang{" "}
          <Link href="/privacy" className="text-accent underline">Chính sách bảo mật</Link>,{" "}
          <Link href="/cookies" className="text-accent underline">Cookie</Link>,{" "}
          <Link href="/terms" className="text-accent underline">Điều khoản</Link> sẽ báo đỏ nếu còn thiếu.</li>
        <li>Mỗi khi thêm tag mới trong GTM (nhất là tag ngoài Google: Facebook Pixel, TikTok…), cập nhật bảng ở trang Cookie và gắn consent tương ứng cho tag.</li>
        <li>Dùng GA4 property và tài khoản Ads riêng cho site demo; đặt thời hạn lưu giữ dữ liệu GA4 phù hợp.</li>
        <li>Giữ <code>noindex</code> để cửa hàng giả không xuất hiện trên Google Search.</li>
      </ul>

      <h2>10. Bài tập</h2>
      <ol>
        <li>Cấu hình đủ mục 3–6, đi một vòng mua hàng và chụp lại Tag Assistant thấy tag Purchase fire với value đúng.</li>
        <li>
          Vào <Link href="/lab/settings" className="text-accent underline">Cài đặt</Link>, bật lần lượt từng lỗi. Với mỗi lỗi: tìm dấu hiệu trong
          Preview (Variables tab), giải thích ảnh hưởng tới báo cáo Ads.
        </li>
        <li>Đặt hàng khi đã “Từ chối tất cả” cookie. So sánh request gửi đi (DevTools → Network, lọc <code>collect</code> và <code>googleadservices</code>).</li>
        <li>
          Chạy mô phỏng traffic, mở <Link href="/lab/funnel" className="text-accent underline">Phễu</Link>. Với target ROAS 1500%, chiến dịch nào nên tăng
          / giảm ngân sách? Bước nào của phễu nên ưu tiên sửa?
        </li>
        <li>Tắt auto-tagging trong Ads Lab rồi mua hàng — kênh hiển thị thế nào? Vì sao auto-tagging quan trọng với Google Ads?</li>
        <li>Thêm một sự kiện mới (vd. <code>add_to_wishlist</code>) vào code, tạo trigger &amp; tag GA4 cho nó.</li>
      </ol>

      <h2>Phụ lục: danh sách event của app</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Khi nào</th><th>Tham số chính</th></tr>
        </thead>
        <tbody>
          {EVENTS.map(([e, when, params]) => (
            <tr key={e}>
              <td><code>{e}</code></td>
              <td>{when}</td>
              <td className="font-mono text-xs">{params}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-muted">
        Code tracking nằm ở <code>lib/tracking.ts</code>, snippet GTM + consent ở <code>app/layout.tsx</code>, bắt gclid/UTM ở{" "}
        <code>instrumentation-client.ts</code>.
      </p>
    </article>
  );
}
