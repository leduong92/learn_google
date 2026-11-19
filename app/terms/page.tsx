import Link from "next/link";
import { DemoCallout, LegalPage } from "@/components/LegalPage";
import { SITE } from "@/lib/site-config";

export const metadata = { title: `Điều khoản sử dụng — ${SITE.brand}` };

const ext = "text-accent underline underline-offset-2";

export default function TermsPage() {
  return (
    <LegalPage title="Điều khoản sử dụng" current="/terms">
      <DemoCallout />

      <h2>1. Website này là gì</h2>
      <p>
        {SITE.domain} (“Website”) do <b>{SITE.operatorName}</b> vận hành, là môi trường mô phỏng phục vụ học tập và kiểm thử cấu
        hình đo lường (Google Tag Manager, Google Analytics 4, Google Ads). Khi truy cập Website, bạn đồng ý với các điều khoản
        dưới đây.
      </p>

      <h2>2. Không có hoạt động mua bán</h2>
      <ul>
        <li>Website <b>không bán hàng hoá, dịch vụ</b>; không nhận đặt hàng thật; không giao hàng; không thu tiền dưới bất kỳ hình thức nào.</li>
        <li>Tên sản phẩm, thương hiệu sản phẩm, hình ảnh, giá, giá gạch ngang, mã giảm giá, phí vận chuyển và “đơn hàng” đều là <b>dữ liệu giả lập</b>, không phải lời chào bán hay cam kết khuyến mại.</li>
        <li>Nút “Đặt hàng” chỉ tạo sự kiện đo lường trong trình duyệt. Không có hợp đồng mua bán nào được xác lập.</li>
        <li>Mọi phương thức thanh toán hiển thị đều là giả lập. <b>Không bao giờ nhập số thẻ, tài khoản ngân hàng, mật khẩu hay giấy tờ tùy thân</b> vào Website.</li>
      </ul>

      <h2>3. Sử dụng hợp lệ</h2>
      <p>Bạn đồng ý không:</p>
      <ul>
        <li>Nhập dữ liệu cá nhân của người khác, hoặc dữ liệu cá nhân thật của chính bạn khi không cần thiết.</li>
        <li>Dùng Website để lừa đảo, giả mạo một cửa hàng thật, hoặc khiến người khác tin rằng có thể mua hàng tại đây.</li>
        <li>Tấn công, quét lỗ hổng, gửi lưu lượng tự động gây quá tải, hoặc tạo click/chuyển đổi giả vào tài khoản quảng cáo của bên khác.</li>
      </ul>

      <h2>4. Quảng cáo dẫn tới Website</h2>
      <p>
        Nếu bạn thấy quảng cáo dẫn tới Website, đó là quảng cáo thử nghiệm của người vận hành. Nội dung quảng cáo không phải là lời
        chào bán. Nếu bạn cho rằng quảng cáo gây hiểu lầm, vui lòng báo cho chúng tôi qua email bên dưới.
      </p>

      <h2>5. Quyền sở hữu trí tuệ</h2>
      <p>
        Mã nguồn và nội dung hướng dẫn thuộc về người vận hành, trừ các tên và nhãn hiệu của bên thứ ba (Google, Google Tag
        Manager, Google Analytics, Google Ads) thuộc về chủ sở hữu tương ứng. Tên “{SITE.brand}” và tên thương hiệu của sản phẩm
        trên Website là hư cấu, không đại diện và không liên kết với bất kỳ doanh nghiệp nào có tên tương tự.
      </p>

      <h2>6. Giới hạn trách nhiệm</h2>
      <p>
        Website và nội dung hướng dẫn được cung cấp “nguyên trạng” cho mục đích học tập, không phải tư vấn pháp lý hay tư vấn
        marketing chuyên nghiệp. Trong phạm vi pháp luật cho phép, người vận hành không chịu trách nhiệm về thiệt hại phát sinh từ
        việc bạn áp dụng nội dung hướng dẫn vào tài khoản Google, website hay hoạt động kinh doanh của bạn.
      </p>

      <h2>7. Dữ liệu cá nhân</h2>
      <p>
        Việc xử lý dữ liệu cá nhân được mô tả tại <Link className={ext} href="/privacy">Chính sách bảo mật</Link> và{" "}
        <Link className={ext} href="/cookies">Chính sách cookie</Link>.
      </p>

      <h2>8. Luật áp dụng &amp; liên hệ</h2>
      <p>
        Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp được ưu tiên giải quyết bằng thương lượng; nếu không thành
        sẽ do cơ quan có thẩm quyền tại Việt Nam giải quyết. Liên hệ: <b>{SITE.contactEmail}</b>.
      </p>

      <h2>9. Thay đổi điều khoản</h2>
      <p>Điều khoản có thể được cập nhật; ngày áp dụng ở đầu trang sẽ thay đổi tương ứng.</p>
    </LegalPage>
  );
}
