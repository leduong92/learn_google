import Link from "next/link";
import { DemoCallout, LegalPage } from "@/components/LegalPage";
import { ClearMyData, OpenCookieSettings } from "@/components/LegalActions";
import { SITE } from "@/lib/site-config";

export const metadata = { title: `Chính sách bảo mật — ${SITE.brand}` };

const ext = "text-accent underline underline-offset-2";

export default function PrivacyPage() {
  return (
    <LegalPage title="Chính sách bảo mật & xử lý dữ liệu cá nhân" current="/privacy">
      <DemoCallout />

      <p className="mt-6">
        Chính sách này là thông báo về việc xử lý dữ liệu cá nhân theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, Nghị định
        356/2025/NĐ-CP và các quy định liên quan. Với người truy cập từ Liên minh châu Âu, Vương quốc Anh hoặc Thụy Sĩ, chính
        sách này cũng cung cấp các thông tin mà GDPR yêu cầu.
      </p>

      <h2>1. Ai chịu trách nhiệm về dữ liệu</h2>
      <p>
        Bên kiểm soát và xử lý dữ liệu: <b>{SITE.operatorName}</b>. Liên hệ về dữ liệu cá nhân và khiếu nại:{" "}
        <b>{SITE.contactEmail}</b>.
      </p>
      <p>
        Bên xử lý dữ liệu thay mặt chúng tôi: <b>Google</b> (Google LLC và các công ty liên kết, gồm Google Ireland Limited đối
        với người dùng ở châu Âu) — cung cấp Google Tag Manager, Google Analytics 4 và Google Ads.
      </p>

      <h2>2. Dữ liệu nào được thu thập</h2>
      <h3>a) Dữ liệu bạn tự nhập</h3>
      <ul>
        <li>Form checkout: email, số điện thoại, họ tên, địa chỉ giao hàng, lựa chọn giao hàng/thanh toán.</li>
        <li>Form nhận ưu đãi ở chân trang: email.</li>
      </ul>
      <p>
        <b>Vui lòng không nhập thông tin thật.</b> Hãy dùng nút “Điền dữ liệu mẫu”. Website không có máy chủ lưu trữ dữ liệu
        này: thông tin chỉ nằm trong bộ nhớ trình duyệt của bạn (localStorage/sessionStorage). Website <b>không</b> thu thập
        thông tin thẻ, tài khoản ngân hàng hay giấy tờ tùy thân và bạn không bao giờ được nhập các thông tin đó.
      </p>
      <h3>b) Dữ liệu thu thập tự động (chỉ khi bạn đồng ý cookie tương ứng)</h3>
      <ul>
        <li>Trang đã xem, nguồn truy cập (tham số UTM, mã click quảng cáo gclid/gbraid/wbraid), thao tác trên website (xem sản phẩm, thêm giỏ, đặt hàng giả lập).</li>
        <li>Định danh cookie/thiết bị, loại trình duyệt, thiết bị, vị trí gần đúng suy ra từ địa chỉ IP (do Google xử lý).</li>
      </ul>
      <p>
        Khi bạn từ chối, các thẻ Google chạy ở chế độ Consent Mode: không ghi cookie quảng cáo/phân tích và chỉ gửi tín hiệu
        không định danh (cookieless ping) để Google ước tính số liệu tổng hợp.
      </p>
      <h3>c) Dữ liệu đã mã hoá cho “Enhanced Conversions”</h3>
      <p>
        Chỉ khi bạn tích ô đồng ý riêng ở bước checkout <b>và</b> đã cho phép <code>ad_user_data</code>: email, số điện thoại,
        họ tên, địa chỉ được chuẩn hoá và băm SHA-256 trước khi Google Tag gửi đến Google, để đối chiếu chuyển đổi quảng cáo.
      </p>

      <h2>3. Mục đích, căn cứ và thời gian xử lý</h2>
      <table>
        <thead>
          <tr><th>Mục đích</th><th>Dữ liệu</th><th>Căn cứ</th><th>Thời gian</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Vận hành chức năng demo (giỏ hàng, nhớ lựa chọn cookie)</td>
            <td>Dữ liệu lưu trong trình duyệt</td>
            <td>Cần thiết để cung cấp chức năng bạn yêu cầu</td>
            <td>Đến khi bạn xoá (nút bên dưới hoặc xoá dữ liệu trình duyệt)</td>
          </tr>
          <tr>
            <td>Thống kê lượt truy cập (Google Analytics 4)</td>
            <td>Mục 2b</td>
            <td>Sự đồng ý <code>analytics_storage</code></td>
            <td>Cookie tối đa 2 năm; dữ liệu trong GA4 theo thời hạn lưu giữ đã cấu hình (không quá 14 tháng)</td>
          </tr>
          <tr>
            <td>Đo lường chuyển đổi quảng cáo (Google Ads)</td>
            <td>Mục 2b, mã click quảng cáo</td>
            <td>Sự đồng ý <code>ad_storage</code>, <code>ad_user_data</code></td>
            <td>Cookie tối đa 90 ngày</td>
          </tr>
          <tr>
            <td>Quảng cáo nhắm lại (remarketing) và cá nhân hoá</td>
            <td>Mục 2b</td>
            <td>Sự đồng ý <code>ad_personalization</code></td>
            <td>Theo thời hạn danh sách đối tượng (tối đa 540 ngày)</td>
          </tr>
          <tr>
            <td>Enhanced Conversions</td>
            <td>Mục 2c (đã băm)</td>
            <td>Sự đồng ý riêng tại checkout</td>
            <td>Theo chính sách của Google cho dữ liệu đối chiếu</td>
          </tr>
        </tbody>
      </table>
      <p>
        Chúng tôi không bán dữ liệu cá nhân, không dùng dữ liệu để ra quyết định tự động gây ảnh hưởng pháp lý tới bạn, và không
        cố ý xử lý dữ liệu cá nhân nhạy cảm.
      </p>

      <h2>4. Chuyển dữ liệu ra nước ngoài</h2>
      <p>
        Dữ liệu ở mục 2b và 2c được Google xử lý trên hệ thống máy chủ đặt ngoài Việt Nam (bao gồm Hoa Kỳ). Khi đồng ý cookie
        phân tích/quảng cáo, bạn được thông báo và đồng ý với việc chuyển này. Xem cách Google sử dụng dữ liệu:{" "}
        <a className={ext} href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">
          policies.google.com/technologies/partner-sites
        </a>{" "}
        và{" "}
        <a className={ext} href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          Chính sách quyền riêng tư của Google
        </a>
        .
      </p>

      <h2>5. Hậu quả, rủi ro có thể xảy ra</h2>
      <ul>
        <li>Bạn có thể thấy quảng cáo của website này trên các trang khác (nếu cho phép <code>ad_personalization</code>).</li>
        <li>Nếu dùng chung máy tính, người khác có thể xem dữ liệu bạn đã nhập trong trình duyệt — hãy xoá sau khi dùng.</li>
        <li>Nếu bạn nhập thông tin thật dù đã được khuyến cáo, thông tin đó có thể xuất hiện trong công cụ gỡ lỗi của trình duyệt và (nếu đồng ý Enhanced Conversions) được gửi dạng băm tới Google.</li>
      </ul>

      <h2>6. Quyền của bạn</h2>
      <p>
        Bạn có quyền được biết, đồng ý hoặc không đồng ý, rút lại sự đồng ý, xem và yêu cầu cung cấp, chỉnh sửa, xoá, hạn chế xử
        lý, phản đối xử lý dữ liệu, khiếu nại, tố cáo và yêu cầu bồi thường theo quy định pháp luật. Việc rút lại sự đồng ý không
        ảnh hưởng đến tính hợp pháp của việc xử lý trước đó.
      </p>
      <div className="not-prose my-4 flex flex-wrap gap-3">
        <OpenCookieSettings />
        <ClearMyData />
      </div>
      <ul>
        <li>Tắt quảng cáo cá nhân hoá của Google: <a className={ext} href="https://myadcenter.google.com" target="_blank" rel="noreferrer">myadcenter.google.com</a>.</li>
        <li>Chặn Google Analytics trên mọi website: <a className={ext} href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer">tiện ích chặn Google Analytics</a>.</li>
        <li>Yêu cầu khác (xoá dữ liệu đã gửi tới Google Analytics của website, khiếu nại): gửi email tới <b>{SITE.contactEmail}</b>. Chúng tôi phản hồi trong thời hạn pháp luật quy định.</li>
      </ul>

      <h2>7. Trẻ em</h2>
      <p>Website không dành cho người dưới 16 tuổi và không cố ý thu thập dữ liệu của trẻ em.</p>

      <h2>8. Bảo mật</h2>
      <p>
        Website chạy qua HTTPS, không có cơ sở dữ liệu phía máy chủ chứa dữ liệu người dùng, và hạn chế tối đa dữ liệu thu thập.
        Dữ liệu gửi tới Google được bảo vệ theo các biện pháp của Google.
      </p>

      <h2>9. Thay đổi chính sách</h2>
      <p>
        Khi chính sách thay đổi, ngày áp dụng ở đầu trang sẽ được cập nhật. Nếu thay đổi mục đích xử lý, chúng tôi sẽ hỏi lại sự
        đồng ý của bạn qua banner cookie. Xem thêm <Link className={ext} href="/cookies">Chính sách cookie</Link> và{" "}
        <Link className={ext} href="/terms">Điều khoản sử dụng</Link>.
      </p>
    </LegalPage>
  );
}
