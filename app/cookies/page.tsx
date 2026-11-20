import { DemoCallout, LegalPage } from "@/components/LegalPage";
import { OpenCookieSettings } from "@/components/LegalActions";
import { SITE } from "@/lib/site-config";

export const metadata = { title: `Chính sách cookie — ${SITE.brand}` };

type Row = [name: string, provider: string, purpose: string, consent: string, duration: string];

const ROWS: Row[] = [
  ["lab_consent_ui (localStorage)", SITE.brand, "Ghi nhớ lựa chọn cookie của bạn", "Cần thiết", "Đến khi bạn xoá"],
  ["lab_cart, lab_settings (localStorage)", SITE.brand, "Giỏ hàng giả lập, cài đặt lab", "Cần thiết", "Đến khi bạn xoá"],
  ["lab_attribution, lab_stats (localStorage)", SITE.brand, "Ghi nhận nguồn truy cập và phễu chuyển đổi để hiển thị cho chính bạn — không gửi đi đâu", "Cần thiết cho chức năng lab", "Đến khi bạn xoá"],
  ["lab_orders, lab_tracked_purchases, lab_customers (localStorage)", SITE.brand, "Đơn hàng giả lập (thay cho máy chủ, giữ 20 đơn gần nhất), danh sách mã đơn đã gửi purchase để không gửi trùng, email đã từng đặt để phân biệt khách mới/cũ — không gửi đi đâu", "Cần thiết", "Đến khi bạn xoá"],
  ["_ga, _ga_<ID>", "Google Analytics", "Phân biệt người dùng và phiên để thống kê", "analytics_storage", "Tối đa 2 năm"],
  ["_gcl_au", "Google Ads", "Đo lường chuyển đổi quảng cáo", "ad_storage", "90 ngày"],
  ["_gcl_aw, _gcl_gb", "Google Ads (Conversion Linker)", "Lưu mã click quảng cáo (gclid/gbraid) để gán chuyển đổi", "ad_storage", "90 ngày"],
  ["IDE, test_cookie và cookie trên miền doubleclick.net / google.com", "Google", "Quảng cáo nhắm lại và cá nhân hoá", "ad_storage + ad_personalization", "13–24 tháng tuỳ khu vực"],
];

export default function CookiesPage() {
  return (
    <LegalPage title="Chính sách cookie" current="/cookies">
      <DemoCallout />
      <p className="mt-6">
        Cookie và bộ nhớ trình duyệt (localStorage/sessionStorage) là các tệp nhỏ lưu trên thiết bị của bạn. Website dùng Google
        Tag Manager để tải các thẻ của Google; các thẻ này tuân theo <b>Consent Mode v2</b>: mặc định mọi loại cookie phân tích và
        quảng cáo bị <b>từ chối</b> cho đến khi bạn chọn đồng ý.
      </p>

      <h2>Các loại sự đồng ý</h2>
      <ul>
        <li><code>analytics_storage</code> — cookie thống kê (Google Analytics).</li>
        <li><code>ad_storage</code> — cookie quảng cáo (đo lường chuyển đổi Google Ads).</li>
        <li><code>ad_user_data</code> — cho phép gửi dữ liệu người dùng liên quan đến quảng cáo cho Google.</li>
        <li><code>ad_personalization</code> — cho phép dùng dữ liệu để cá nhân hoá quảng cáo (remarketing).</li>
      </ul>

      <h2>Danh sách cookie &amp; bộ nhớ</h2>
      <table>
        <thead>
          <tr><th>Tên</th><th>Bên đặt</th><th>Mục đích</th><th>Cần đồng ý</th><th>Thời hạn</th></tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i} className={i === 0 ? "font-mono text-xs" : ""}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-muted">
        Tên và thời hạn cookie của Google có thể thay đổi theo cấu hình container GTM và theo Google. Người vận hành cần cập nhật
        bảng này mỗi khi thêm thẻ mới (đặc biệt thẻ của bên thứ ba ngoài Google).
      </p>

      <h2>Thay đổi hoặc rút lại sự đồng ý</h2>
      <p>Bạn có thể thay đổi bất kỳ lúc nào, việc rút lại dễ như khi đồng ý:</p>
      <div className="my-4">
        <OpenCookieSettings className="btn-primary" />
      </div>
      <p>
        Bạn cũng có thể xoá cookie trong cài đặt trình duyệt. Xem thêm cách Google sử dụng cookie tại{" "}
        <a className="text-accent underline underline-offset-2" href="https://policies.google.com/technologies/cookies" target="_blank" rel="noreferrer">
          policies.google.com/technologies/cookies
        </a>
        .
      </p>
    </LegalPage>
  );
}
