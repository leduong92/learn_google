import { Suspense } from "react";
import PaymentStatusClient from "./component/PaymentStatusClient";

export const metadata = { title: "Trạng thái thanh toán" };

/** /checkout/status/[order] — nơi cổng thanh toán (kiểu Stripe) redirect về sau khi khách trả tiền */
export default function PaymentStatusPage({ params }: PageProps<"/checkout/status/[order]">) {
  // Đọc params bên trong Suspense (Cache Components): mã đơn chỉ biết lúc chạy
  return (
    <div className="mx-auto flex max-w-3xl justify-center px-4 py-12">
      <Suspense fallback={<p className="py-16 text-muted">Đang tải…</p>}>
        <StatusContent params={params} />
      </Suspense>
    </div>
  );
}

async function StatusContent({ params }: Pick<PageProps<"/checkout/status/[order]">, "params">) {
  const { order } = await params;
  return <PaymentStatusClient order={decodeURIComponent(order)} />;
}
