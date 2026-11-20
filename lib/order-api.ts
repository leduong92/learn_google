/**
 * Giả lập backend + cổng thanh toán kiểu Stripe — KHÔNG có máy chủ hay thanh toán thật.
 *
 * Luồng thật thường là:
 *   Bấm "Đặt hàng" → backend tạo đơn (Pending) → Stripe xử lý thẻ → redirect về /checkout/status/[order]
 *   → trang status hỏi lại API mỗi vài giây cho tới khi đơn thành "Paid" hoặc "Failed".
 *
 * Ở đây "database" là localStorage (khoá `lab_orders`), nên link trang status mở ở tab khác vẫn thấy đơn —
 * giống website thật (đơn nằm trên server, không nằm trong tab).
 */
import type { Order } from "./lab-state";

/** Kết quả bạn chọn ở bước thanh toán để luyện các tình huống */
export type PaymentOutcome = "success" | "failed" | "slow";

export const PAYMENT_OUTCOMES: { id: PaymentOutcome; label: string; hint: string }[] = [
  { id: "success", label: "Thanh toán thành công", hint: "Pending ~5 giây → Paid" },
  { id: "failed", label: "Thẻ bị từ chối", hint: "Pending ~5 giây → Failed" },
  { id: "slow", label: "Ngân hàng xử lý quá lâu", hint: "Pending suốt 30 giây → trang status hết thời gian chờ" },
];

export type OrderStatusLabel = "Pending" | "Paid" | "Failed";

/** Dữ liệu API trả về — giống OrderDto của một backend thật */
export type OrderDto = Order & {
  orderStatusLabel: OrderStatusLabel;
  paidAt: number | null;
};

export type ApiResult<T> = { isSuccess: true; data: T } | { isSuccess: false; error: string };

type OrderRecord = { order: Order; outcome: PaymentOutcome };

const KEY = "lab_orders";
/** Thời gian "Stripe" xử lý thanh toán */
const PROCESSING_MS = 5_000;

function readAll(): Record<string, OrderRecord> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** Backend nhận đơn mới (trạng thái Pending). Chỉ giữ 20 đơn gần nhất. */
export function createOrder(order: Order, outcome: PaymentOutcome) {
  const all = readAll();
  all[order.transaction_id] = { order, outcome };
  const recent = Object.entries(all)
    .sort(([, a], [, b]) => b.order.created - a.order.created)
    .slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(recent)));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Giống `clientApi.get('/api/order/tracking/:id')` — có độ trễ mạng giả */
export const orderApi = {
  async getTracking(transactionId: string): Promise<ApiResult<OrderDto>> {
    await sleep(300 + Math.random() * 400);
    const rec = readAll()[transactionId];
    if (!rec) return { isSuccess: false, error: "Không tìm thấy đơn hàng" };

    const doneAt = rec.order.created + PROCESSING_MS;
    const processing = Date.now() < doneAt;
    const orderStatusLabel: OrderStatusLabel =
      processing || rec.outcome === "slow" ? "Pending" : rec.outcome === "success" ? "Paid" : "Failed";

    return {
      isSuccess: true,
      data: { ...rec.order, orderStatusLabel, paidAt: orderStatusLabel === "Paid" ? doneAt : null },
    };
  },
};
