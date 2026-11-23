import Link from "next/link";

export const metadata = { title: "Bài học GTM & Google Ads — từ đầu" };

/* ---------------- Code mẫu cho từng bài ---------------- */

const B1_ENV = `NEXT_GTM_ID=GTM-XXXXXXX   # thay bằng ID container của bạn`;

const B1_LAYOUT = `// app/layout.tsx — đặt ngay dưới các dòng import
const GTM_ID = process.env.NEXT_GTM_ID;

// ...trong RootLayout, thay khối comment "TODO Bài 1" trong <head> bằng:
<head>
  {GTM_ID && (
    <>
      {/* (1) Tạo dataLayer + hàm gtag — phải chạy TRƯỚC khi GTM tải */}
      <script
        dangerouslySetInnerHTML={{
          __html: \`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          \`,
        }}
      />
      {/* (2) Tải container GTM */}
      <script async src={\`https://www.googletagmanager.com/gtm.js?id=\${GTM_ID}\`} />
    </>
  )}
</head>`;

const B3_PUSH = `// app/products/[slug]/ProductDetail.tsx — trong hàm addToCart(), chỗ "TODO Bài 3"
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ ecommerce: null }); // xoá dữ liệu ecommerce của event trước
window.dataLayer.push({
  event: "add_to_cart",
  ecommerce: {
    currency: "VND",
    value: p.price * qty,          // phải là SỐ, không phải chuỗi "18.900.000 ₫"
    items: [
      {
        item_id: p.id,             // SKU
        item_name: p.name,
        item_brand: p.brand,
        item_category: p.category,
        item_variant: variant,
        price: p.price,
        quantity: qty,
      },
    ],
  },
});`;

const B4_HELPER = `// lib/datalayer.ts — tự tạo file mới này
import type { Product } from "./products";

/** Đổi 1 sản phẩm thành 1 phần tử của mảng items (tên chuẩn GA4) */
export function toItem(p: Product, quantity = 1, variant?: string) {
  return {
    item_id: p.id,
    item_name: p.name,
    item_brand: p.brand,
    item_category: p.category,
    item_category2: p.category2,
    item_variant: variant,
    price: p.price,
    quantity,
  };
}

/** Reset ecommerce + push event; currency mặc định VND */
export function pushEcommerce(event: string, ecommerce: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ecommerce: { currency: "VND", ...ecommerce } });
}`;

const B4_IMPORT = `import { pushEcommerce, toItem } from "@/lib/datalayer";`;

const B4_GRID = `// components/ProductGrid.tsx
// ① trong useTrackOnce (xoá dòng "void listName;")
pushEcommerce("view_item_list", {
  item_list_id: listId,
  item_list_name: listName,
  items: products.map((p, index) => ({ ...toItem(p), index })),
});

// ② trong onClick của <Link> (xoá dòng "void index;")
pushEcommerce("select_item", {
  item_list_id: listId,
  item_list_name: listName,
  items: [{ ...toItem(p), index }],
});`;

const B4_DETAIL = `// app/products/[slug]/ProductDetail.tsx
// ③ trong useTrackOnce
pushEcommerce("view_item", { value: p.price, items: [toItem(p)] });

// Viết lại add_to_cart của Bài 3 trong addToCart() — 20 dòng còn 1:
pushEcommerce("add_to_cart", { value: p.price * qty, items: [toItem(p, qty, variant)] });`;

const B4_CART = `// app/cart/page.tsx
// ④ trong useTrackOnce
pushEcommerce("view_cart", {
  value,
  items: resolved.map((l) => toItem(l.product, l.quantity, l.variant)),
});

// ⑤ cuối hàm changeQty() — bấm + → add_to_cart; bấm − hoặc Xoá → remove_from_cart
const n = Math.abs(diff);
pushEcommerce(diff > 0 ? "add_to_cart" : "remove_from_cart", {
  value: line.product.price * n,
  items: [toItem(line.product, n, line.variant)],
});`;

const B4_CHECKOUT = `// app/checkout/page.tsx
// Thêm 1 dòng ngay dưới "const coupon = ...":
const items = resolved.map((l) => toItem(l.product, l.quantity, l.variant));

// ⑥ trong useTrackOnce
pushEcommerce("begin_checkout", { value, coupon: coupon || undefined, items });

// ⑦ trong submitInfo()
pushEcommerce("add_shipping_info", {
  value, coupon: coupon || undefined, shipping_tier: shipping.id, items,
});

// ⑧ trong placeOrder()
pushEcommerce("add_payment_info", {
  value, coupon: coupon || undefined, payment_type: payment.id, items,
});`;

const B4_REGEX = `^(view_item_list|select_item|view_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|add_shipping_info|add_payment_info)$`;

const WALK: [string, string][] = [
  ["Mở trang chủ", "view_item_list (home_featured)"],
  ["Click Sofa", "select_item → view_item → view_item_list (Sản phẩm liên quan)"],
  ["Bấm Thêm vào giỏ", "add_to_cart"],
  ["Mở Giỏ hàng", "view_cart"],
  ["Bấm + rồi −", "add_to_cart → remove_from_cart"],
  ["Bấm Thanh toán", "begin_checkout"],
  ["Điền thông tin → Tiếp tục", "add_shipping_info"],
  ["Bấm Đặt hàng", "add_payment_info (rồi chuyển sang trang trạng thái thanh toán — purchase là Bài 5)"],
];

const B5_FLOW = `Bấm "Đặt hàng"
  → backend tạo đơn, trạng thái Pending          (lib/order-api.ts → createOrder)
  → cổng thanh toán xử lý ~5 giây                (giả lập Stripe)
  → redirect về /checkout/status/NM-XXXX
  → trang status gọi API mỗi 3 giây (tối đa 30s)  (orderApi.getTracking)
       ├─ Paid    → xoá giỏ + trackPurchase(res.data)   ← purchase gửi Ở ĐÂY
       ├─ Failed  → báo lỗi, giữ giỏ, KHÔNG gửi purchase
       └─ hết 30s → "chưa xác nhận được", KHÔNG gửi purchase`;

const B5_TRACK = `// lib/datalayer.ts — thêm import ở đầu file:
// import { getProductById, type Product } from "./products";
// import type { OrderDto } from "./order-api";

const TRACKED_KEY = "lab_tracked_purchases";

function readTracked(): string[] {
  try { return JSON.parse(localStorage.getItem(TRACKED_KEY) || "[]"); }
  catch { return []; }
}

/** Gửi purchase ĐÚNG 1 LẦN cho mỗi mã đơn */
export function trackPurchase(order: OrderDto) {
  const tracked = readTracked();
  if (tracked.includes(order.transaction_id)) return; // ✅ đã gửi → không gửi lại

  pushEcommerce("purchase", {
    transaction_id: order.transaction_id,
    value: order.value,              // đã trừ giảm giá, KHÔNG gồm ship
    shipping: order.shipping,
    coupon: order.coupon || undefined,
    customer_type: order.new_customer ? "new" : "returning",
    items: order.items.flatMap((it) => {
      const p = getProductById(it.productId);
      return p ? [toItem(p, it.quantity, it.variant)] : [];
    }),
  });

  localStorage.setItem(TRACKED_KEY, JSON.stringify([...tracked, order.transaction_id].slice(-50)));
}`;

const B5_STATUS = `// app/checkout/status/[order]/component/PaymentStatusClient.tsx — trong hàm poll()
const res = await orderApi.getTracking(order);
if (!isMounted) return;

if (res.isSuccess) {
  const status = res.data.orderStatusLabel.toLowerCase();
  if (status === "authorized" || status === "paid") {
    cartStore.set({ lines: [], coupon: "" }); // thanh toán xong mới xoá giỏ
    setOrderData(res.data);
    setFinalStatus("authorized");
    trackPurchase(res.data);   // ✅ res.data — KHÔNG phải orderData
    return;
  }
}`;

const B5_BUG = `// ❌ LỖI HAY GẶP — gửi purchase với dữ liệu undefined
setOrderData(res.data);
trackEvent("purchase", {
  transaction_id: orderData?.id,        // orderData = state lúc effect bắt đầu = undefined
  value: orderData?.totalAmount,        // undefined
});`;

const B7_CONSENT = `// app/layout.tsx — sửa đoạn script (1) của Bài 1 thành:
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Mặc định: TỪ CHỐI hết, cho tới khi người dùng chọn
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});

// Người dùng đã chọn ở lần truy cập trước? → áp dụng lại ngay
try {
  var c = JSON.parse(localStorage.getItem('lab_consent_ui') || 'null');
  if (c && c.decided) gtag('consent', 'update', c.state);
} catch (e) {}

gtag('js', new Date());`;

const B7_BANNER = `// components/ConsentBanner.tsx — trong hàm apply(), chỗ "TODO Bài 7"
window.gtag?.("consent", "update", state);
window.dataLayer?.push({ event: "consent_update" }); // ?. — không lỗi khi chưa nhúng GTM`;

const B8_USERDATA = `// lib/datalayer.ts — viết lại trackPurchase() của Bài 5: GỘP user_data vào CÙNG MỘT lần push
// Nhớ import: consentStore (từ "./lab-state")
export function trackPurchase(order: OrderDto) {
  const tracked = readTracked();
  if (tracked.includes(order.transaction_id)) return; // ✅ chống trùng — luôn đặt TRƯỚC mọi lần push

  const allowed =
    order.ec_consent && consentStore.get().state.ad_user_data === "granted";

  window.dataLayer = window.dataLayer || [];
  // Reset cả ecommerce lẫn user_data: dataLayer GỘP dữ liệu giữa các lần push,
  // không reset thì email của đơn trước còn "dính" sang đơn sau (kể cả khi đơn sau không đồng ý)
  window.dataLayer.push({ ecommerce: null, user_data: null });
  window.dataLayer.push({
    event: "purchase",
    ecommerce: {
      currency: "VND",
      transaction_id: order.transaction_id,
      value: order.value,
      shipping: order.shipping,
      coupon: order.coupon || undefined,
      customer_type: order.new_customer ? "new" : "returning",
      items: order.items.flatMap((it) => {
        const p = getProductById(it.productId);
        return p ? [toItem(p, it.quantity, it.variant)] : [];
      }),
    },
    // Chỉ thêm user_data khi được phép — không được phép thì KHÔNG có khoá này
    ...(allowed && {
      user_data: {
        email: order.customer.email.trim().toLowerCase(),
        phone_number: "+84" + order.customer.phone.replace(/\\D/g, "").replace(/^0/, ""),
      },
    }),
  });

  localStorage.setItem(TRACKED_KEY, JSON.stringify([...tracked, order.transaction_id].slice(-50)));
}`;

const B10_LEAD = `// components/SiteFooter.tsx — trong onSubmit(), chỗ "TODO Bài 10"
window.dataLayer?.push({
  event: "generate_lead",
  lead_source: "newsletter_footer",
  value: 50000,        // ước tính 1 người đăng ký đáng bao nhiêu
  currency: "VND",
});`;

const B10_SIGNUP = `// app/register/page.tsx — hàm register(), chỗ TODO "push event sign_up"
window.dataLayer?.push({ event: "sign_up", method });   // "email" hoặc "google"`;

const B10_SIGNUP_LEAD = `// app/register/page.tsx — BÊN TRONG if (newsletter) { … } có sẵn, chỗ TODO "generate_lead"
// (chỉ 1 lần push này — sign_up đã push ở trên rồi)
window.dataLayer?.push({
  event: "generate_lead",
  lead_source: "register_form",
  value: 50000,
  currency: "VND",
});`;

const B10_LOGIN = `// app/register/page.tsx — hàm login(), chỗ TODO "login"
window.dataLayer?.push({ event: "login", method: account.method });`;

const B10_FLOW = `Khách add_to_cart nhưng KHÔNG purchase
  → GA4 gom vào Audience "Bỏ giỏ 14 ngày"         (chỉ người đã đồng ý ad_personalization — Bài 7)
  → tự đẩy sang Google Ads (liên kết GA4 ↔ Ads)
  → chiến dịch Display / Demand Gen chỉ hiện quảng cáo cho nhóm này
  → khách quay lại mua → purchase (đo bằng Bài 5–6)`;

const B11_FLOW = `Người dùng tìm "sofa gỗ gần đây" trên Google Maps
  └─ Quảng cáo Maps = ghim / kết quả của Google Business Profile (KHÔNG phải trang web)
       ├─ bấm Chỉ đường / Gọi ngay trên quảng cáo  → Google tự đo trong Google Ads (không qua GTM)
       └─ bấm vào website → /maps → bấm "Chỉ đường" / "Gọi"
                                   └─ GTM: trigger Click → GA4 get_directions / click_to_call (bài này)`;

const B11_LINKS = `<!-- app/maps/StoreMap.tsx — đã có sẵn, KHÔNG cần sửa -->
<a href="https://www.google.com/maps/dir/?api=1&destination=21.0287,105.8524"
   target="_blank" data-store-id="hn-hoan-kiem">Chỉ đường</a>

<a href="tel:+840000000001" data-store-id="hn-hoan-kiem">Gọi 0000 000 001</a>`;

/* ---------------- Danh sách bài ---------------- */

const LESSONS = [
  ["bai-0", "Bài 0", "Bức tranh tổng thể & cách học"],
  ["bai-1", "Bài 1", "Nhúng GTM vào website"],
  ["bai-2", "Bài 2", "GA4: đếm lượt xem trang (không cần code)"],
  ["bai-3", "Bài 3", "Event đầu tiên: add_to_cart"],
  ["bai-3b", "Bài 3.5", "Variables: tạo biến & cách dùng"],
  ["bai-4", "Bài 4", "Cả phễu mua hàng"],
  ["bai-5", "Bài 5", "purchase & chống đếm trùng"],
  ["bai-6", "Bài 6", "Google Ads: chuyển đổi mua hàng"],
  ["bai-7", "Bài 7", "Consent Mode v2 (bắt buộc trước khi public)"],
  ["bai-8", "Bài 8", "Enhanced Conversions"],
  ["bai-9", "Bài 9", "Publish & đưa lên mạng"],
  ["bai-10", "Bài 10", "Lead, đăng ký & remarketing người bỏ giỏ"],
  ["bai-11", "Bài 11", "Showroom & quảng cáo Google Maps"],
] as const;

const DLV_SET: [string, string, string][] = [
  ["DLV - ecommerce.value", "ecommerce.value", "Bài 3, 6 (giá trị chuyển đổi), trigger giá trị cao"],
  ["DLV - ecommerce.currency", "ecommerce.currency", "Bài 6 (Currency của tag Ads)"],
  ["DLV - ecommerce.transaction_id", "ecommerce.transaction_id", "Bài 5, 6 (chống đếm trùng)"],
  ["DLV - ecommerce.items", "ecommerce.items", "Xem cả mảng khi gỡ lỗi; đầu vào cho Custom JS"],
  ["DLV - item_id", "ecommerce.items.0.item_id", "Remarketing theo sản phẩm"],
  ["DLV - item_variant", "ecommerce.items.0.item_variant", "Lọc trigger theo màu/kích thước"],
  ["DLV - user_data.email", "user_data.email", "Bài 8 (Enhanced Conversions)"],
];

const CJS_QTY = `// Tên biến: CJS - tổng số lượng   (loại Custom JavaScript)
function () {
  var items = {{DLV - ecommerce.items}} || [];
  var total = 0;
  for (var i = 0; i < items.length; i++) total += items[i].quantity || 0;
  return total;
}`;

const FUNNEL: [string, string, string][] = [
  ["① view_item_list", "components/ProductGrid.tsx (useTrackOnce)", "item_list_id, item_list_name, items (+ index)"],
  ["② select_item", "components/ProductGrid.tsx (onClick)", "item_list_id, item_list_name, items[1 sản phẩm + index]"],
  ["③ view_item", "app/products/[slug]/ProductDetail.tsx", "value, items"],
  ["④ view_cart", "app/cart/page.tsx (useTrackOnce)", "value, items"],
  ["⑤ add_to_cart / remove_from_cart", "app/cart/page.tsx (changeQty)", "value, items (phần thay đổi)"],
  ["⑥ begin_checkout", "app/checkout/page.tsx (useTrackOnce)", "value, coupon, items"],
  ["⑦ add_shipping_info", "app/checkout/page.tsx (submitInfo)", "+ shipping_tier"],
  ["⑧ add_payment_info", "app/checkout/page.tsx (placeOrder)", "+ payment_type"],
];

function Code({ children }: { children: string }) {
  return (
    <pre>
      <code>{children}</code>
    </pre>
  );
}

function Check({ items }: { items: string[] }) {
  return (
    <div className="my-4 rounded-lg border border-[#c9dcc9] bg-[#eef3ee] px-4 py-3">
      <p className="text-sm font-semibold text-accent">✅ Kiểm tra — xong khi:</p>
      <ul className="mt-1">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function Warn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border border-[#ecd3a6] bg-[#fbf3e4] px-4 py-3">
      <p className="text-sm font-semibold text-[#8a5a12]">⚠ {title}</p>
      <div className="mt-1 text-[15px] leading-7">{children}</div>
    </div>
  );
}

function Lesson({ id, children }: { id: string; children: React.ReactNode }) {
  const l = LESSONS.find((x) => x[0] === id)!;
  return (
    <section id={id} className="scroll-mt-6 border-t border-line pt-2">
      <h2>
        <span className="text-accent">{l[1]}.</span> {l[2]}
      </h2>
      {children}
    </section>
  );
}

export default function GuidePage() {
  return (
    <article className="prose-lab mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Học GTM &amp; Google Ads từ đầu</h1>
      <p className="mt-3 text-muted">
        Cửa hàng này <b>chưa có dòng tracking nào</b>. Bạn sẽ tự nhúng GTM, tự viết từng <code>dataLayer.push</code>, rồi tự cấu
        hình GTM → GA4 → Google Ads. Mỗi bài có: việc cần làm trong code, việc cần làm trong GTM, và cách kiểm tra.
      </p>
      <p className="mt-2 text-muted">
        Gặp menu, trường hay thuật ngữ lạ? Tra trong{" "}
        <Link href="/lab/glossary" className="text-accent underline">
          📖 Từ điển
        </Link>{" "}
        (có ô tìm kiếm, gõ không dấu được).
      </p>

      <nav className="card my-6 p-4">
        <p className="mb-2 text-sm font-semibold">Mục lục</p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {LESSONS.map(([id, n, t]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-accent hover:underline">
                {n}: {t}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Lesson id="bai-0">
        <pre>{`Website  ──dataLayer.push({ event: 'add_to_cart', ... })──►  GTM
                                                              │ Trigger: "khi event = add_to_cart"
                                                              ├─► Tag GA4        → báo cáo, phễu
                                                              └─► Tag Google Ads → chuyển đổi, tối ưu giá thầu`}</pre>
        <ul>
          <li><b>dataLayer</b>: một mảng JavaScript. Website “kể” chuyện gì vừa xảy ra bằng cách push object vào mảng.</li>
          <li><b>GTM</b>: nghe dataLayer. <i>Trigger</i> = khi nào; <i>Variable</i> = lấy giá trị gì; <i>Tag</i> = gửi đi đâu.</li>
          <li><b>GA4 / Google Ads</b>: nơi nhận dữ liệu và làm báo cáo.</li>
        </ul>
        <h3>Cách học trong project này</h3>
        <ul>
          <li>
            Tìm chỗ cần viết code: trong VS Code bấm <code>Cmd+Shift+F</code>, gõ <code>TODO Bài</code>. Mỗi chỗ ghi rõ dữ liệu nào đã
            có sẵn.
          </li>
          <li>Nút <b>dataLayer</b> ở góc phải màn hình cho bạn thấy mọi thứ bạn push, kèm cảnh báo ⚠ nếu dữ liệu sai.</li>
          <li>
            Bí quá thì xem <b>đáp án</b>: code mẫu ngay trong từng bài; bản làm sẵn ở nhánh <code>dev</code> (cấu trúc cũ: dùng{" "}
            <code>trackEcommerce</code> trong <code>lib/tracking.ts</code> và trang <code>/checkout/success</code>), ví dụ{" "}
            <code>git show dev:app/products/[slug]/ProductDetail.tsx</code>. Làm xong một lượt thì commit lại — nhánh đó thành đáp án
            của chính bạn khi luyện lại.
          </li>
          <li>
            Gặp menu, trường lạ trong GTM / GA4 / Google Ads → tra <Link href="/lab/glossary" className="text-accent underline">📖 Từ
            điển</Link>. Giao diện Google đổi thường xuyên; thấy khác hướng dẫn thì tìm theo tên trường.
          </li>
          <li>Học trên <code>localhost</code> trước. Chỉ đưa lên tên miền thật sau Bài 7.</li>
        </ul>
      </Lesson>

      <Lesson id="bai-1">
        <p>
          Đoạn code GTM đưa cho bạn (màn hình “Install manually”) làm 2 việc: tạo <code>window.dataLayer</code> + hàm{" "}
          <code>gtag</code>, và tải file <code>gtm.js</code> của container. Trong Next.js, ta viết lại đúng 2 việc đó bằng JSX.
        </p>
        <h3>Trong code</h3>
        <ol>
          <li>
            Tạo file <code>.env.local</code> ở thư mục gốc project (git đã bỏ qua file này):
            <Code>{B1_ENV}</Code>
          </li>
          <li>
            Mở <code>app/layout.tsx</code>, tìm <code>TODO Bài 1</code>, sửa thành:
            <Code>{B1_LAYOUT}</Code>
          </li>
          <li>
            <b>Tắt và chạy lại</b> <code>npm run dev</code> (biến môi trường chỉ được đọc lúc khởi động).
          </li>
        </ol>
        <p className="text-sm text-muted">
          Vì sao script (1) đứng trước (2)? <code>gtm.js</code> tải bất đồng bộ (<code>async</code>); đặt phần tạo dataLayer lên trước
          để chắc chắn nó luôn có sẵn khi GTM chạy. Vì sao không dán nguyên văn? JSX không cho viết nội dung bên trong thẻ{" "}
          <code>&lt;script&gt;</code> như HTML, phải dùng <code>dangerouslySetInnerHTML</code>.
        </p>
        <p className="text-sm text-muted">
          Console báo <i>“Encountered a script tag while rendering React component”</i> ngay sau khi bạn sửa <code>layout.tsx</code>? Đó
          là cảnh báo của chế độ dev khi trang tự tải lại (hot reload) — GTM vẫn chạy. Mở tab mới thì hết. (Cách khác của Next.js:{" "}
          <code>next/script</code> với <code>strategy=&quot;beforeInteractive&quot;</code>.)
        </p>
        <h3>Trong GTM — bật Preview (Tag Assistant)</h3>
        <p>Chưa cần tạo tag nào. Giữ <code>npm run dev</code> đang chạy, rồi:</p>
        <ol>
          <li>
            Ở tab <b>Workspace</b>, bấm <b>Preview</b> (góc trên bên phải). Một tab mới mở trang <code>tagassistant.google.com</code>.
          </li>
          <li>
            Trong tab đó, tuỳ giao diện bạn thấy:
            <ul>
              <li>
                Có hộp <b>“Connect Tag Assistant to your site”</b> với ô <b>Your website’s URL</b> → nhập{" "}
                <code>http://localhost:3000</code>.
              </li>
              <li>
                <b>Không có ô nhập</b>, chỉ thấy trang Tag Assistant với nút <b>Add domain</b> → bấm <b>Add domain</b> → nhập{" "}
                <code>http://localhost:3000</code> (phải có <code>http://</code> ở đầu).
              </li>
            </ul>
          </li>
          <li>
            Bấm <b>Connect</b>. Website mở ở cửa sổ/tab mới, góc dưới bên phải hiện <b>“Tag Assistant Connected”</b>.
          </li>
          <li>
            Quay lại tab Tag Assistant → bấm <b>Continue</b> → thấy giao diện debug, cột trái là danh sách event.
          </li>
        </ol>
        <p className="text-sm text-muted">
          Không kết nối được? (1) Trình duyệt chặn cửa sổ bật lên → cho phép popup cho <code>tagassistant.google.com</code>. (2) Tắt
          trình chặn quảng cáo cho <code>localhost</code>. (3) Bỏ tick <b>Include debug signal in the URL</b> rồi thử lại. (4) Kiểm tra
          thanh đen trên cùng website đã báo “● đã load” — Tag Assistant chỉ kết nối được khi trang có đúng container GTM. Nên cài thêm
          tiện ích Chrome <b>Tag Assistant</b> để website mở trong tab thay vì cửa sổ riêng.
        </p>
        <Check
          items={[
            "Thanh đen trên cùng chuyển thành “GTM: GTM-… ● đã load”.",
            "Nút dataLayer hiện vài mục (gtag(\"js\"…), gtm.js…).",
            "Tag Assistant báo Connected và thấy các event Container Loaded, DOM Ready, Window Loaded.",
          ]}
        />
      </Lesson>

      <Lesson id="bai-2">
        <p>
          Bài này không viết code. Bạn tạo nơi nhận dữ liệu (GA4), rồi dùng GTM gắn <b>Google Tag</b> — tag “nền” của GA4, tự gửi{" "}
          <code>page_view</code> mỗi lần xem trang.
        </p>

        <h3>1. Tạo GA4 (tài khoản → property → data stream)</h3>
        <p>
          Cấu trúc của GA4: <b>Account</b> (thường là 1 công ty) → <b>Property</b> (1 website/app, nơi chứa báo cáo) →{" "}
          <b>Data stream</b> (nguồn gửi dữ liệu: Web, iOS, Android). Lần đầu dùng GA4 thì <b>phải tạo Account</b>; lần sau chỉ cần
          tạo thêm Property trong Account cũ.
        </p>
        <ol>
          <li>
            Vào <code>analytics.google.com</code> → <b>Bắt đầu đo lường</b> (hoặc Admin → <b>Tạo</b> → Tài khoản). Màn hình “Tạo tài
            khoản” có 5 bước:
            <ol>
              <li><b>Tạo tài khoản</b>: tên tuỳ ý, vd. <code>Hoc GTM</code>. Các ô chia sẻ dữ liệu để mặc định cũng được.</li>
              <li>
                <b>Tạo thuộc tính</b> (property): tên vd. <code>Nha Moc – lab</code>, múi giờ <b>Việt Nam</b>, đơn vị tiền{" "}
                <b>Đồng Việt Nam (VND)</b>. Tiền tệ đặt sai thì báo cáo doanh thu sẽ quy đổi sai.
              </li>
              <li><b>Thông tin doanh nghiệp</b>: ngành nghề và quy mô, chọn gì cũng được.</li>
              <li><b>Mục tiêu kinh doanh</b>: chọn “Tăng doanh số bán hàng trực tuyến” (để GA4 hiện sẵn các báo cáo ecommerce).</li>
              <li>
                <b>Thu thập dữ liệu</b>: chọn nền tảng <b>Web</b> → URL <code>localhost:3000</code> (sau này đổi thành tên miền thật
                cũng được), tên luồng vd. <code>Web lab</code> → <b>Tạo luồng</b>.
              </li>
            </ol>
          </li>
          <li>
            Màn hình chi tiết luồng hiện ra. Ghi lại <b>Measurement ID</b> dạng <code>G-XXXXXXXXXX</code> (góc trên bên phải). Phần
            “Hướng dẫn cài đặt” GA4 đưa ra thì <b>bỏ qua</b> — mình cài qua GTM.
            <br />
            <span className="text-sm text-muted">
              GA4 bây giờ có thể đưa một mã <code>gtm.js?id=GTM-…</code> với ID <b>khác</b> container của bạn: đó là container Google
              tự tạo để lưu cài đặt của Google Tag (Tag Assistant ghi “Container IDs: GTM-…, G-…”). <b>Không dán</b> mã đó vào website
              (sẽ thành 2 container), nhưng cũng <b>đừng xoá</b> container đó.
            </span>
          </li>
          <li>
            Ngay trong màn hình đó, mục <b>Enhanced measurement</b> (Đo lường nâng cao) phải đang bật. Bấm ⚙ → kiểm tra{" "}
            <b>Page views</b> → “Page changes based on browser history events” đang bật. Next.js chuyển trang không tải lại, thiếu mục
            này thì chỉ có page_view ở trang đầu tiên.
          </li>
        </ol>

        <h3>2. Trong GTM — tạo Google Tag</h3>
        <ol>
          <li>
            Tags → <b>New</b> → đặt tên <code>GA4 - Google Tag</code>.
          </li>
          <li>
            Tag Configuration → <b>Google Tag</b> → Tag ID = Measurement ID ở trên (<code>G-XXXXXXXXXX</code>).
          </li>
          <li>
            Triggering → <b>Initialization - All Pages</b> → <b>Save</b>.
          </li>
          <li>
            Bấm <b>Preview</b> lại (mỗi lần sửa trong GTM đều phải Preview lại thì Tag Assistant mới thấy bản mới). Đi qua vài trang
            của website.
          </li>
        </ol>
        <p className="text-sm text-muted">
          Đặt tên theo quy ước <code>Loại - Chi tiết</code> ngay từ đầu: tag <code>GA4 - …</code>, trigger <code>CE - …</code> (Custom
          Event), biến <code>DLV - …</code> (Data Layer Variable). Container sau này có hàng chục tag, tên rõ ràng giúp tìm nhanh.
        </p>

        <Warn title="GA4 có thể tự thêm tag vào GTM của bạn">
          <p>
            Khi đi qua màn hình cài đặt của GA4, Google có thể tự tạo tag <code>Google Analytics G-…</code> (loại “Google Analytics”,
            trigger Initialization) trong container của bạn. Nó trùng việc với <code>GA4 - Google Tag</code> → vào Tags, tick tag đó →
            🗑 Delete. Container chỉ nên có <b>một</b> Google tag cho mỗi ID.
          </p>
        </Warn>

        <h3>3. Đọc Tag Assistant cho đúng</h3>
        <ul>
          <li>
            Cột trái bấm mốc <b>Initialization</b> → <code>GA4 - Google Tag</code> nằm ở <b>Tags Fired</b>. Đúng.
          </li>
          <li>
            Bấm các mốc <b>History</b> (sinh ra khi bạn chuyển trang) → Google Tag nằm ở <b>Tags Not Fired</b>. <b>Cũng đúng</b>: Google
            Tag chỉ chạy 1 lần mỗi lần tải trang; page_view khi chuyển trang do chính GA4 tự gửi nhờ Enhanced measurement.
          </li>
          <li>
            Ngoài tag của bạn, Tags Fired có thể có thêm ô <b>Google Analytics G-…</b> (fired 1 time). Đó không phải tag trùng: đó là
            phần “đích” GA4 do Google Tag tải về cùng các cài đặt của nó (Enhanced measurement…).
          </li>
          <li>
            Muốn xem GA4 đã <b>gửi</b> gì: bấm <b>Summary</b> (hoặc một mốc) → tab <b>Hits Sent</b>, liệt kê từng hit (vd.{" "}
            <code>Page View</code>, <code>Scroll</code>). Hàng chip trên cùng có chip <code>GTM-…</code> và chip <code>G-…</code>; hit
            nằm ở chip của <b>container đã gửi nó</b> — tuỳ loại Google Tag mà là chip GTM hoặc chip G-. Chip này trống thì xem chip
            kia.
          </li>
          <li>
            GA4 gom nhiều event vào một lần gửi, nên hit có thể nằm ở mốc <b>sau</b> mốc event. Xem ở <b>Summary</b> là chắc nhất.
          </li>
        </ul>
        <Check
          items={[
            "Tag Assistant: mốc Initialization có GA4 - Google Tag ở Tags Fired.",
            "Summary → Hits Sent thấy Page View, mỗi lần tải/chuyển trang có thêm một Page View (không phải 2).",
            "GA4 → Báo cáo → Thời gian thực (Realtime) hoặc Admin → DebugView thấy page_view.",
          ]}
        />
      </Lesson>

      <Lesson id="bai-3">
        <h3>Trong code</h3>
        <p>
          Mở <code>app/products/[slug]/ProductDetail.tsx</code>, tìm <code>TODO Bài 3</code>:
        </p>
        <Code>{B3_PUSH}</Code>
        <ul>
          <li><code>event</code>: tên sự kiện — GTM dùng để kích hoạt trigger. Dùng đúng tên chuẩn GA4 để có báo cáo ecommerce tự động.</li>
          <li><code>{"{ ecommerce: null }"}</code>: dataLayer <i>gộp</i> dữ liệu giữa các lần push; xoá trước để items cũ không bị dính sang.</li>
          <li><code>value</code> và <code>price</code> là số; <code>currency</code> bắt buộc khi có value.</li>
        </ul>
        <Warn title="Tên nào được đổi, tên nào không">
          <p>
            <code>event: &quot;add_to_cart&quot;</code>, <code>ecommerce</code>, <code>currency</code>, <code>value</code>,{" "}
            <code>items</code>, <code>item_id</code>… là <b>tên chuẩn của GA4</b> — giữ đúng từng chữ, GA4 mới tự làm báo cáo phễu và
            doanh thu. Dữ liệu riêng của bạn (vd. <code>page_type</code>) thì tự đặt tên. Tên biến trong GTM (
            <code>DLV - …</code>) đặt gì cũng được, miễn đường dẫn khớp code.
          </p>
          <p className="mt-1">
            Danh sách đầy đủ:{" "}
            <Link href="/lab/glossary#ten-chuan-ecommerce" className="text-accent underline">
              Từ điển → Tên event chuẩn
            </Link>
            ,{" "}
            <Link href="/lab/glossary#ten-chuan-item" className="text-accent underline">
              tham số sản phẩm
            </Link>{" "}
            và{" "}
            <Link href="/lab/glossary#ten-chuan-quy-tac" className="text-accent underline">
              quy tắc đặt tên
            </Link>
            .
          </p>
        </Warn>
        <p>
          Lưu file → mở một sản phẩm → bấm <b>Thêm vào giỏ</b> → mở nút <b>dataLayer</b> góc phải: phải thấy <code>add_to_cart</code>{" "}
          (màu xanh), bấm vào xem đủ dữ liệu, không có ⚠. Chưa đúng ở bước này thì đừng sang GTM.
        </p>

        <h3>Trong GTM — Variable, Trigger, Tag</h3>
        <p>
          Ba khối luôn đi cùng nhau: <b>Trigger</b> = <i>khi nào</i> chạy, <b>Variable</b> = <i>lấy giá trị gì</i>, <b>Tag</b> ={" "}
          <i>gửi đi đâu</i>.
        </p>
        <ol>
          <li>
            <b>Variable</b> — Variables → User-Defined Variables → <b>New</b> → tên <code>DLV - ecommerce.value</code> → loại{" "}
            <b>Data Layer Variable</b> → Data Layer Variable Name: <code>ecommerce.value</code> (dấu chấm = đi vào object con) → Data
            Layer Version: <b>Version 2</b> → Save. Bài này biến chỉ để <i>xem</i> trong Preview; Bài 6 sẽ dùng nó cho Google Ads.
          </li>
          <li>
            <b>Trigger</b> — Triggers → <b>New</b> → tên <code>CE - add_to_cart</code> → loại <b>Custom Event</b> → Event name:{" "}
            <code>add_to_cart</code> (phân biệt hoa thường, phải giống hệt chữ trong code) → This trigger fires on:{" "}
            <b>All Custom Events</b> → Save.
          </li>
          <li>
            <b>Tag</b> — Tags → <b>New</b> → tên <code>GA4 - Event - add_to_cart</code> → loại <b>Google Analytics: GA4 Event</b>:
            <ul>
              <li>
                Measurement ID: nhập <code>G-XXXXXXXXXX</code>. Thấy dòng ✅ <b>“Google tag found in this container”</b> là đúng — tag
                này dùng chung cấu hình với <code>GA4 - Google Tag</code> của Bài 2.
              </li>
              <li>Event Name: <code>add_to_cart</code>.</li>
              <li>
                More Settings → <b>Ecommerce</b> → tick <b>Send Ecommerce data</b>, Data source: <b>Data Layer</b>. GA4 tự đọc{" "}
                <code>ecommerce.items</code>, <code>value</code>, <code>currency</code> — không cần tạo biến cho từng trường.
              </li>
              <li>
                Triggering → chọn <b>chỉ</b> <code>CE - add_to_cart</code> → Save.
              </li>
            </ul>
          </li>
          <li>
            Bấm <b>Preview</b> lại → trên website bấm <b>Thêm vào giỏ</b>.
          </li>
        </ol>

        <Warn title="Tag event chỉ được có MỘT trigger — trigger của chính nó">
          <p>
            Nếu phần Triggering hiện <code>CE - add_to_cart</code> <b>OR</b> <code>Initialization - All Pages</code>, tag sẽ chạy khi{" "}
            <i>một trong hai</i> xảy ra → mỗi lần tải bất kỳ trang nào GA4 nhận một <code>add_to_cart</code> giả, không có sản phẩm.
            Báo cáo “Thêm vào giỏ” và tỷ lệ chuyển đổi sai hết. Bấm dấu <b>⊖</b> bên phải dòng thừa để bỏ.
          </p>
          <p className="mt-1">
            Nguyên tắc: <b>Google Tag</b> → <code>Initialization - All Pages</code>. <b>Tag GA4 Event</b> → chỉ trigger của đúng event
            đó.
          </p>
        </Warn>

        <h3>Kiểm tra trong Tag Assistant</h3>
        <ol>
          <li>
            Bấm mốc <b>Initialization</b> → <code>GA4 - Event - add_to_cart</code> phải ở <b>Tags Not Fired</b>. (Nếu nó ở Tags Fired →
            bạn còn trigger thừa, xem khung ⚠ ở trên.)
          </li>
          <li>
            Bấm mốc <b>add_to_cart</b> → tag đó ở <b>Tags Fired</b>.
          </li>
          <li>
            Vẫn ở mốc đó, tab <b>Variables</b> → <code>DLV - ecommerce.value</code> có giá trị là <b>số</b> (vd. <code>18900000</code>
            ), không phải <code>undefined</code>. Tab <b>Data Layer</b> thấy nguyên object bạn đã push.
          </li>
          <li>
            Bấm <b>Summary</b> → tab <b>Hits Sent</b>: bấm “Thêm vào giỏ” bao nhiêu lần thì có bấy nhiêu ô <b>Add to Cart</b>. Không thấy
            thì đổi sang chip còn lại (GTM ↔ G-).
          </li>
        </ol>
        <Check
          items={[
            "Nút dataLayer hiện add_to_cart, không có ⚠.",
            "Tag Assistant: tag GA4 Event KHÔNG fire ở Initialization, CHỈ fire ở add_to_cart.",
            "Tab Variables: DLV - ecommerce.value đúng số tiền.",
            "Summary → Hits Sent: số ô Add to Cart = số lần bấm.",
            "GA4 → Admin → DebugView thấy add_to_cart, bấm vào → mục Items có sản phẩm.",
          ]}
        />

        <h3>Lỗi hay gặp</h3>
        <table>
          <thead>
            <tr>
              <th>Hiện tượng</th>
              <th>Nguyên nhân / cách sửa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Có mốc add_to_cart nhưng tag ở Not Fired</td>
              <td>Tên event trong trigger khác trong code (hoa/thường, gạch dưới, dấu cách thừa). Hoặc quên Preview lại sau khi Save.</td>
            </tr>
            <tr>
              <td>Không có mốc add_to_cart trong Tag Assistant</td>
              <td>Code chưa chạy: xem nút dataLayer trước. Hoặc trang web đang mở không phải trang Tag Assistant kết nối (tab cũ).</td>
            </tr>
            <tr>
              <td>DLV - ecommerce.value = undefined</td>
              <td>Gõ sai tên biến (<code>ecommerce.value</code>), hoặc chọn Data Layer Version 1.</td>
            </tr>
            <tr>
              <td>add_to_cart xuất hiện ở mọi trang</td>
              <td>Tag có thêm trigger <code>Initialization - All Pages</code>.</td>
            </tr>
            <tr>
              <td>DebugView trống</td>
              <td>Đợi 10–30 giây; chọn đúng thiết bị ở ô “Debug device”. Hits Sent có hit là dữ liệu đã đi.</td>
            </tr>
          </tbody>
        </table>

        <h3>Tự kiểm tra hiểu bài</h3>
        <ul>
          <li>Đổi code thành <code>event: &quot;Add_To_Cart&quot;</code> → tag có fire không? Vì sao?</li>
          <li>
            Bỏ dòng <code>{"{ ecommerce: null }"}</code>, thêm 2 sản phẩm khác nhau liên tiếp → xem tab Data Layer ở lần thứ 2, có gì
            lạ?
          </li>
          <li>
            Đổi <code>value</code> thành chuỗi <code>&quot;18.900.000 ₫&quot;</code> → nút dataLayer báo gì? GA4 sẽ ghi doanh thu bao
            nhiêu?
          </li>
        </ul>
        <p className="mt-6 text-sm text-muted">
          Muốn hiểu kỹ Variables (các loại biến, lấy giá trị trong mảng <code>items</code>, dùng biến trong trigger)? Xem{" "}
          <a href="#bai-3b" className="text-accent underline">Bài 3.5</a> trước khi sang Bài 4.
        </p>
      </Lesson>

      <Lesson id="bai-3b">
        <p>
          <b>Variable</b> (biến) là “ô chứa giá trị” mà GTM tính lại <b>ở mỗi event</b>: giá trị đơn hàng, URL trang, mã gclid, tên
          event… Tag và trigger không tự biết những giá trị này — chúng hỏi biến.
        </p>

        <h3>1. Biến được dùng ở 3 chỗ</h3>
        <table>
          <thead>
            <tr>
              <th>Chỗ dùng</th>
              <th>Ví dụ trong project</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Trong ô cấu hình của Tag</b></td>
              <td>
                Tag Google Ads Conversion: Conversion Value = <code>{"{{DLV - ecommerce.value}}"}</code>. Tag GA4 Event: Event Name ={" "}
                <code>{"{{Event}}"}</code>.
              </td>
            </tr>
            <tr>
              <td><b>Trong điều kiện của Trigger</b></td>
              <td>
                Chỉ fire khi <code>{"{{DLV - ecommerce.value}}"}</code> <i>greater than</i> <code>10000000</code> (giỏ hàng giá trị
                cao).
              </td>
            </tr>
            <tr>
              <td><b>Làm đầu vào cho biến khác</b></td>
              <td>
                Lookup Table lấy <code>{"{{Page Hostname}}"}</code> để biết đang ở localhost hay tên miền thật.
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          Cú pháp: tên biến nằm trong 2 cặp ngoặc nhọn <code>{"{{Tên biến}}"}</code>. Không cần gõ tay: bấm biểu tượng{" "}
          <b>➕ (hình viên gạch)</b> cạnh ô nhập → chọn biến trong danh sách. Tên biến phân biệt hoa thường.
        </p>

        <h3>2. Biến có sẵn (Built-In Variables)</h3>
        <p>
          Variables → <b>Built-In Variables</b> → <b>Configure</b> → tick để bật. Một số biến mặc định đã bật sẵn; nhóm Click và Form
          phải tự bật.
        </p>
        <table>
          <thead>
            <tr>
              <th>Biến</th>
              <th>Giá trị ví dụ</th>
              <th>Dùng để</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>Event</code></td>
              <td><code>add_to_cart</code></td>
              <td>Event Name động cho 1 tag GA4 chung (Bài 4)</td>
            </tr>
            <tr>
              <td><code>Page Path</code></td>
              <td><code>/products/sofa-…</code></td>
              <td>Trigger chỉ chạy ở một nhóm trang, vd. Page Path <i>starts with</i> <code>/checkout</code></td>
            </tr>
            <tr>
              <td><code>Page Hostname</code></td>
              <td><code>localhost</code></td>
              <td>Tách môi trường học và tên miền thật</td>
            </tr>
            <tr>
              <td><code>Page URL</code>, <code>Referrer</code></td>
              <td><code>http://localhost:3000/cart</code></td>
              <td>Điều kiện trigger, gỡ lỗi</td>
            </tr>
            <tr>
              <td><code>Click Text</code>, <code>Click URL</code></td>
              <td><code>Thêm vào giỏ</code></td>
              <td>Trigger kiểu Click (đo nút bấm không có dataLayer.push)</td>
            </tr>
          </tbody>
        </table>

        <h3>3. Biến tự tạo (User-Defined) — các loại hay dùng</h3>
        <p>Variables → User-Defined Variables → <b>New</b> → đặt tên → bấm vùng Variable Configuration → chọn loại.</p>

        <h4 className="mt-4 font-semibold">a. Data Layer Variable — dùng nhiều nhất</h4>
        <p>
          Đọc giá trị bạn đã push vào dataLayer. Luôn chọn <b>Version 2</b>. Dấu chấm để đi vào object con; vào phần tử mảng thì dùng{" "}
          <b>dấu chấm + số thứ tự</b> (bắt đầu từ 0), <b>không</b> viết <code>[0]</code>:
        </p>
        <pre>{`{ event: "add_to_cart",
  ecommerce: {
    currency: "VND",                 ← ecommerce.currency
    value: 18900000,                 ← ecommerce.value
    items: [                         ← ecommerce.items   (cả mảng)
      { item_id: "SKU-SOFA-001",          ← ecommerce.items.0.item_id
        item_variant: "Xám tro" }    ← ecommerce.items.0.item_variant
    ] } }`}</pre>
        <p>Bộ biến nên tạo cho cả khoá học:</p>
        <table>
          <thead>
            <tr>
              <th>Tên biến</th>
              <th>Data Layer Variable Name</th>
              <th>Dùng ở</th>
            </tr>
          </thead>
          <tbody>
            {DLV_SET.map(([name, path, use]) => (
              <tr key={name}>
                <td><code>{name}</code></td>
                <td><code className="break-all">{path}</code></td>
                <td className="text-sm">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Warn title="items.0 chỉ đọc sản phẩm ĐẦU TIÊN">
          <p>
            Ổn với add_to_cart ở trang sản phẩm (chỉ 1 item). Với <code>view_cart</code>, <code>begin_checkout</code>,{" "}
            <code>purchase</code> nhiều sản phẩm thì biến bỏ sót phần còn lại — để GA4 tự đọc cả mảng qua <b>Send Ecommerce data</b>.
          </p>
        </Warn>

        <h4 className="mt-4 font-semibold">b. Constant — giá trị cố định, sửa 1 chỗ</h4>
        <p>
          Tên <code>CONST - GA4 ID</code>, Value = <code>G-XXXXXXXXXX</code>. Sau đó trong <code>GA4 - Google Tag</code> (Tag ID) và
          các tag GA4 Event (Measurement ID) điền <code>{"{{CONST - GA4 ID}}"}</code> thay vì gõ ID. Đổi property chỉ cần sửa biến
          này. Tương tự cho Google Ads: <code>CONST - Ads Conversion ID</code>.
        </p>

        <h4 className="mt-4 font-semibold">c. URL — đọc tham số trên đường dẫn</h4>
        <p>
          Tên <code>URL - gclid</code>, Component Type: <b>Query</b>, Query Key: <code>gclid</code>. Tạo thêm{" "}
          <code>URL - utm_source</code>, <code>URL - utm_campaign</code> cùng cách. Thử: vào{" "}
          <Link href="/lab/ads" className="text-accent underline">Mô phỏng click Ads</Link>, click quảng cáo → mốc đầu tiên trong
          Tag Assistant, tab Variables thấy gclid và utm.
        </p>

        <h4 className="mt-4 font-semibold">d. 1st-Party Cookie — đọc cookie</h4>
        <p>
          Tên <code>COOKIE - _gcl_aw</code>, Cookie Name: <code>_gcl_aw</code>. Dùng ở Bài 6 để kiểm tra Conversion Linker đã lưu mã
          click hay chưa (có giá trị dạng <code>GCL.1700000000.abc…</code>).
        </p>

        <h4 className="mt-4 font-semibold">e. Lookup Table — “nếu A thì B”</h4>
        <p>
          Tên <code>LT - Môi trường</code>, Input Variable: <code>{"{{Page Hostname}}"}</code>, thêm dòng: <code>localhost</code> →{" "}
          <code>dev</code>. Tick <b>Set Default Value</b> → <code>prod</code>.
        </p>
        <p>
          Dùng: trigger của tag Google Ads Conversion thêm điều kiện <code>{"{{LT - Môi trường}}"}</code> <i>equals</i>{" "}
          <code>prod</code> → đặt hàng thử trên localhost không làm bẩn số liệu chuyển đổi thật. (Regex Table giống hệt nhưng cột
          Input là biểu thức regex.)
        </p>

        <h4 className="mt-4 font-semibold">f. Custom JavaScript — tự tính giá trị</h4>
        <p>Khi không có sẵn giá trị cần dùng. Phải là <b>một hàm không tên, có return</b>, không được thay đổi trang:</p>
        <Code>{CJS_QTY}</Code>
        <p className="text-sm text-muted">
          Biến Custom JS có thể gọi biến khác bằng <code>{"{{…}}"}</code>. Chỉ dùng khi thật cần — logic để trong code website (khi
          push dataLayer) dễ kiểm soát hơn.
        </p>

        <h3>4. Ví dụ đầy đủ: trigger “giỏ hàng giá trị cao”</h3>
        <ol>
          <li>
            Triggers → New → tên <code>CE - add_to_cart - high value</code> → Custom Event, Event name <code>add_to_cart</code>.
          </li>
          <li>
            This trigger fires on: <b>Some Custom Events</b> → <code>DLV - ecommerce.value</code> <b>greater than</b>{" "}
            <code>10000000</code> → Save.
          </li>
          <li>
            Gắn cho một tag mới, vd. GA4 Event tên <code>high_value_add_to_cart</code> (dùng tạo đối tượng remarketing sau này).
          </li>
          <li>Preview: thêm Đèn sàn (4,25 triệu) → tag Not Fired; thêm Sofa (18,9 triệu) → Fired.</li>
        </ol>

        <h3>5. Gỡ lỗi biến trong Tag Assistant</h3>
        <ul>
          <li>
            Bấm từng mốc ở cột trái → tab <b>Variables</b>: biến được tính <b>tại thời điểm event đó</b>. Ở mốc Initialization,{" "}
            <code>DLV - ecommerce.value</code> là <code>undefined</code> là đúng — chưa ai push.
          </li>
          <li>Tab <b>Data Layer</b> cho thấy dữ liệu thật tại mốc đó — so với tên biến xem có gõ sai đường dẫn không.</li>
        </ul>
        <table>
          <thead>
            <tr>
              <th>Biến ra undefined vì…</th>
              <th>Sửa</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Gõ sai đường dẫn / hoa thường</td><td>Copy đúng tên trường từ tab Data Layer.</td></tr>
            <tr><td>Viết <code>items[0]</code></td><td>Đổi thành <code>items.0</code>.</td></tr>
            <tr><td>Chọn Data Layer Version 1</td><td>Chọn Version 2.</td></tr>
            <tr><td>Đang xem sai mốc</td><td>Chọn đúng mốc event đã push giá trị đó.</td></tr>
            <tr><td>Custom JS không có <code>return</code></td><td>Thêm return; kiểm tra lỗi cú pháp (GTM báo khi Save).</td></tr>
          </tbody>
        </table>
        <Check
          items={[
            "Đã tạo bộ Data Layer Variable trong bảng ở mục 3a.",
            "Bấm Thêm vào giỏ → tab Variables thấy value, currency, item_id, item_variant đúng; đổi phiên bản thì item_variant đổi theo.",
            "Click quảng cáo giả ở /lab/ads → URL - gclid có giá trị.",
            "Trigger “high value” chỉ fire với sản phẩm trên 10 triệu.",
          ]}
        />
      </Lesson>

      <Lesson id="bai-4">
        <p>
          Mục tiêu: đo đủ <b>9 event</b> từ trang chủ tới nút Đặt hàng, nhưng trong GTM chỉ dùng <b>1 trigger + 1 tag</b>. Mẹo học: đọc
          gợi ý ở mỗi <code>TODO Bài 4</code> và <b>tự viết trước</b>, rồi mới so với code mẫu bên dưới.
        </p>
        <p>Toàn cảnh — 8 chỗ cần viết:</p>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Viết ở đâu (tìm TODO Bài 4)</th>
              <th>Tham số</th>
            </tr>
          </thead>
          <tbody>
            {FUNNEL.map(([e, where, params]) => (
              <tr key={e}>
                <td><code>{e}</code></td>
                <td className="font-mono text-xs">{where}</td>
                <td className="text-sm">{params}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-muted">
          <code>useTrackOnce</code> đã được viết sẵn: đoạn code bên trong chỉ chạy 1 lần. (Ở chế độ dev, React cố ý chạy effect 2 lần
          — nếu push trực tiếp trong <code>useEffect</code> bạn sẽ thấy event bị trùng.)
        </p>

        <h3>Bước 1 — Tạo helper cho gọn</h3>
        <p>
          Bài 3 tốn khoảng 20 dòng cho 1 event; 9 event thì quá dài. Gom phần lặp lại vào 2 hàm: <code>toItem</code> đổi sản phẩm thành
          item chuẩn GA4, <code>pushEcommerce</code> lo phần reset + push + <code>currency</code>.
        </p>
        <Code>{B4_HELPER}</Code>
        <p>Mỗi file dùng helper thêm dòng import ở đầu file:</p>
        <Code>{B4_IMPORT}</Code>

        <h3>Bước 2 — Điền 8 chỗ TODO Bài 4</h3>
        <p>
          Tìm bằng <code>Cmd+Shift+F</code> → <code>TODO Bài 4</code>.
        </p>
        <Code>{B4_GRID}</Code>
        <p className="text-sm text-muted">
          <code>index</code> = vị trí sản phẩm trong danh sách (0, 1, 2…) → biết vị trí nào được click nhiều.{" "}
          <code>{"{ ...toItem(p), index }"}</code> = lấy hết trường của <code>toItem</code> rồi thêm <code>index</code>.
        </p>
        <Code>{B4_DETAIL}</Code>
        <Code>{B4_CART}</Code>
        <p className="text-sm text-muted">
          Ở trang giỏ, <code>value</code> và <code>quantity</code> là <b>phần thay đổi</b> (<code>n</code>), không phải tổng cả giỏ.
        </p>
        <Code>{B4_CHECKOUT}</Code>
        <p className="text-sm text-muted">
          <code>coupon || undefined</code>: không có mã giảm giá thì bỏ hẳn trường, thay vì gửi chuỗi rỗng. <code>value</code> lấy từ{" "}
          <code>computeTotals</code> — đã trừ giảm giá, <b>không gồm ship</b>, đúng chuẩn GA4.
        </p>

        <h3>Bước 3 — Trong GTM: sửa trigger &amp; tag của Bài 3 (không tạo mới)</h3>
        <p>
          Không tạo 9 tag cho 9 event. Sửa lại đúng trigger và tag của Bài 3 để <b>một</b> tag gửi được mọi event ecommerce.
        </p>
        <ol>
          <li>
            Mở trigger <code>CE - add_to_cart</code> → đổi tên thành <code>CE - ecommerce</code> → Event name:
            <Code>{B4_REGEX}</Code>→ tick <b>Use regex matching</b> → Save. (<code>^</code> và <code>$</code> bắt khớp nguyên tên, tránh
            khớp nhầm event như <code>view_item_list_old</code>; <code>|</code> nghĩa là “hoặc”.)
          </li>
          <li>
            Mở tag <code>GA4 - Event - add_to_cart</code> → đổi tên thành <code>GA4 - Event - ecommerce</code> → Event Name: bấm biểu
            tượng viên gạch ➕ bên cạnh ô → chọn <code>{"{{Event}}"}</code> (biến có sẵn, chứa tên event vừa push → một tag gửi đúng
            tên cho cả 9 event). Không thấy biến này thì vào Variables → Built-In Variables → <b>Configure</b> → tick <b>Event</b>.
          </li>
          <li>
            Measurement ID giữ <code>{"{{CONST - GA4 ID}}"}</code>, <b>Send Ecommerce data</b> vẫn bật. Trigger của tag chỉ một:{" "}
            <code>CE - ecommerce</code>. Save → <b>Preview</b> lại.
          </li>
        </ol>

        <h3>Bước 4 — Đi một vòng phễu &amp; đối chiếu</h3>
        <table>
          <thead>
            <tr>
              <th>Bạn làm</th>
              <th>Event phải thấy (nút dataLayer &amp; Tag Assistant)</th>
            </tr>
          </thead>
          <tbody>
            {WALK.map(([act, ev]) => (
              <tr key={act}>
                <td>{act}</td>
                <td className="font-mono text-xs">{ev}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Check
          items={[
            "Nút dataLayer: đủ các event trong bảng, không có ⚠, không event nào bị trùng.",
            "Tag Assistant: ở mỗi mốc ecommerce, GA4 - Event - ecommerce nằm ở Tags Fired.",
            "Summary → Hits Sent: các ô mang đúng tên event (View Item, Begin Checkout…), không phải 9 ô cùng một tên.",
            "Bấm một mốc → tab Variables → Event = đúng tên event của mốc đó.",
          ]}
        />

        <h3>Lỗi hay gặp</h3>
        <table>
          <thead>
            <tr>
              <th>Hiện tượng</th>
              <th>Nguyên nhân / cách sửa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Lỗi đỏ <code>Cannot find name &apos;pushEcommerce&apos;</code></td>
              <td>Quên dòng import ở đầu file.</td>
            </tr>
            <tr>
              <td>Có event trong dataLayer nhưng tag Not Fired</td>
              <td>Event chưa có trong regex của trigger, hoặc quên tick Use regex matching, hoặc chưa Preview lại.</td>
            </tr>
            <tr>
              <td>Mọi hit trong Hits Sent đều tên add_to_cart</td>
              <td>Event Name của tag vẫn gõ cứng <code>add_to_cart</code> → đổi thành <code>{"{{Event}}"}</code>.</td>
            </tr>
            <tr>
              <td>view_item / view_cart xuất hiện 2 lần</td>
              <td>Push trong <code>useEffect</code> thường thay vì trong <code>useTrackOnce</code>.</td>
            </tr>
            <tr>
              <td>view_cart không xuất hiện</td>
              <td>Giỏ đang trống — code đã chặn (<code>if (cart.lines.length === 0) return;</code>).</td>
            </tr>
            <tr>
              <td>select_item không thấy trong Tag Assistant</td>
              <td>Click bằng chuột giữa / mở tab mới → trang mới có dataLayer mới. Click chuột trái bình thường.</td>
            </tr>
          </tbody>
        </table>

        <h3>Tự kiểm tra hiểu bài</h3>
        <ul>
          <li>Vì sao event ở trang giỏ dùng <code>n</code> (phần thay đổi) chứ không dùng tổng số lượng trong giỏ?</li>
          <li>Bỏ <code>^</code> và <code>$</code> khỏi regex thì điều gì có thể xảy ra?</li>
          <li>
            Vì sao <code>view_item_list</code> ở trang sản phẩm có <code>item_list_id</code> khác trang chủ? Báo cáo GA4 dùng nó để làm
            gì?
          </li>
        </ul>
      </Lesson>

      <Lesson id="bai-5">
        <p>
          <code>purchase</code> là event quan trọng nhất — GA4 tính doanh thu và Google Ads tối ưu giá thầu dựa vào nó. Hai yêu cầu:
          có <code>transaction_id</code>, và chỉ gửi <b>1 lần</b> cho mỗi đơn.
        </p>

        <h3>Luồng thanh toán (giống website dùng Stripe)</h3>
        <p>
          Website thật không biết ngay khách trả tiền thành công hay chưa: cổng thanh toán xử lý vài giây rồi mới redirect về trang
          của bạn. Lab mô phỏng đúng luồng đó:
        </p>
        <Code>{B5_FLOW}</Code>
        <p className="text-sm text-muted">
          Ở bước thanh toán có khung <b>🧪 Mô phỏng cổng thanh toán</b> để chọn: thành công / thẻ bị từ chối / ngân hàng xử lý quá lâu.
          “Database” là localStorage (<code>lab_orders</code>) nên mở link status ở tab khác vẫn thấy đơn — giống website thật.
        </p>

        <p>
          Có <b>2 chỗ</b> cần viết — tìm <code>TODO Bài 5</code>: <b>(1/2)</b> hàm <code>trackPurchase</code> trong{" "}
          <code>lib/datalayer.ts</code>, <b>(2/2)</b> chỗ gọi hàm trong <code>PaymentStatusClient.tsx</code>. Đọc gợi ý trong TODO và{" "}
          <b>tự viết trước</b>; code bên dưới là đáp án để so. Chưa làm thì đơn vẫn chạy bình thường nhưng không có{" "}
          <code>purchase</code> nào.
        </p>

        <h3>1. Hàm trackPurchase — gửi 1 lần cho mỗi mã đơn</h3>
        <Code>{B5_TRACK}</Code>
        <ul>
          <li>
            <b>Chống trùng bằng danh sách mã đơn đã gửi</b> (<code>lab_tracked_purchases</code>): reload trang status, mở lại link từ
            email/lịch sử, React StrictMode… đều không gửi lại. Lưu ở localStorage (không phải sessionStorage) vì link có thể mở ở tab
            khác.
          </li>
          <li><code>order.items</code> chỉ lưu <code>productId</code> → tra lại bằng <code>getProductById</code>; <code>flatMap</code> bỏ qua sản phẩm không tìm thấy.</li>
          <li>
            <code>customer_type</code>: <code>new</code> / <code>returning</code>. Lab đoán theo email đã từng đặt trên trình duyệt này;
            web thật chỉ gửi khi biết chắc (tra hệ thống đơn hàng).
          </li>
        </ul>

        <h3>2. Gọi ở trang status khi API báo Paid</h3>
        <Code>{B5_STATUS}</Code>
        <Warn title="Dùng res.data, KHÔNG dùng state vừa set">
          <p>Lỗi này rất hay gặp trên website thật — purchase vẫn “fire” nhưng mọi giá trị đều undefined:</p>
          <Code>{B5_BUG}</Code>
          <p>
            <code>setOrderData()</code> chỉ hẹn React cập nhật ở lần render sau; trong hàm <code>poll</code> (tạo từ lần render đầu),{" "}
            <code>orderData</code> vẫn là giá trị cũ. Luôn lấy dữ liệu từ <b>biến vừa nhận được</b> (<code>res.data</code>).
          </p>
        </Warn>
        <ul>
          <li><b>Chỉ gửi khi Paid.</b> Failed hoặc hết thời gian chờ → không có doanh thu → không gửi.</li>
          <li><b>Xoá giỏ khi Paid</b>, không xoá lúc bấm Đặt hàng — thẻ bị từ chối thì khách còn giỏ để thử lại.</li>
          <li>
            <code>clearTimeout(timer)</code> trong hàm dọn của <code>useEffect</code>: rời trang thì ngừng hỏi API.
          </li>
        </ul>

        <h3>3. Trong GTM</h3>
        <ol>
          <li>
            Thêm <code>purchase</code> vào regex của trigger <code>CE - ecommerce</code> (thêm <code>|purchase</code> trước{" "}
            <code>)$</code>). Tag <code>GA4 - Event - ecommerce</code> tự gửi nhờ <code>{"{{Event}}"}</code>.
          </li>
          <li>
            Tạo 2 Data Layer Variable cho Bài 6: <code>DLV - ecommerce.transaction_id</code> (
            <code>ecommerce.transaction_id</code>) và <code>DLV - ecommerce.currency</code> (<code>ecommerce.currency</code>) — xem{" "}
            <a href="#bai-3b" className="text-accent underline">Bài 3.5</a>.
          </li>
          <li>Save → Preview lại. GA4 → Admin → Events: kiểm tra <code>purchase</code> đã được đánh dấu là key event.</li>
        </ol>

        <h3>4. Kiểm tra cả 3 tình huống</h3>
        <table>
          <thead>
            <tr>
              <th>Làm</th>
              <th>Phải thấy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Đặt hàng, chọn <b>Thanh toán thành công</b> (thử thêm mã WELCOME10)</td>
              <td>
                Spinner ~5 giây → “Thanh toán thành công”. dataLayer có <code>purchase</code> với <code>transaction_id</code> dạng{" "}
                <code>NM-…</code>, không ⚠. Giỏ hàng về 0.
              </td>
            </tr>
            <tr>
              <td>Reload trang status</td>
              <td>Vẫn hiện thành công nhưng <b>KHÔNG</b> có purchase mới.</td>
            </tr>
            <tr>
              <td>Copy URL trang status sang tab mới</td>
              <td>Hiện đơn đã thanh toán, <b>KHÔNG</b> có purchase mới (đã có trong <code>lab_tracked_purchases</code>).</td>
            </tr>
            <tr>
              <td>Đặt hàng, chọn <b>Thẻ bị từ chối</b></td>
              <td>“Thanh toán không thành công”, giỏ còn nguyên, <b>không</b> có purchase.</td>
            </tr>
            <tr>
              <td>Đặt hàng, chọn <b>Ngân hàng xử lý quá lâu</b></td>
              <td>Hỏi API khoảng 10 lần trong 30 giây → “Chưa xác nhận được”, <b>không</b> có purchase.</td>
            </tr>
          </tbody>
        </table>
        <Check
          items={[
            "Tag Assistant, mốc purchase: GA4 - Event - ecommerce ở Tags Fired; tab Variables: DLV - ecommerce.transaction_id = NM-…",
            "Summary → Hits Sent có ô Purchase — đúng 1 ô cho mỗi đơn thành công.",
            "GA4 DebugView thấy purchase có transaction_id, value, Items. Báo cáo Monetization → Ecommerce purchases có doanh thu sau 24–48 giờ.",
          ]}
        />

        <h3>Tự kiểm tra hiểu bài</h3>
        <ul>
          <li>Xoá dòng <code>if (tracked.includes(…)) return;</code> rồi reload trang status 3 lần — dataLayer thấy gì? Doanh thu GA4 bị tính thế nào?</li>
          <li>Vì sao gửi purchase ở trang status khi đã Paid, không gửi lúc bấm “Đặt hàng”?</li>
          <li>
            Khách đóng tab ngay sau khi trả tiền, trước khi về trang status → purchase có được gửi không? (Gợi ý: web thật gửi thêm từ
            server khi nhận webhook của Stripe — GA4 Measurement Protocol, Meta Conversions API.)
          </li>
          <li>Dùng mã WELCOME10: <code>value</code> khác tổng price × quantity của items. GA4 dùng số nào cho Purchase revenue, số nào cho Item revenue?</li>
        </ul>
      </Lesson>

      <Lesson id="bai-6">
        <p>
          Mục tiêu: khi có <code>purchase</code>, gửi thêm một <b>chuyển đổi</b> sang Google Ads kèm giá trị và mã đơn — để Google
          Ads biết quảng cáo nào ra đơn và tối ưu giá thầu theo doanh thu (ROAS). <b>Không cần viết code</b>: dữ liệu đã có từ Bài 5,
          chỉ cấu hình trong Google Ads và GTM.
        </p>
        <pre>{`dataLayer: purchase ─► GTM ─┬─► GA4 Event (Bài 4–5)          → báo cáo
                            └─► Google Ads Conversion (Bài 6) → tối ưu quảng cáo
Click quảng cáo ?gclid=… ─► Conversion Linker ─► cookie _gcl_aw ─► ghép đơn với đúng click`}</pre>

        <h3>Bước 1 — Tạo conversion action trong Google Ads</h3>
        <p className="text-sm text-muted">
          Chưa có tài khoản: vào <code>ads.google.com</code>, khi được hỏi tạo chiến dịch thì chọn <b>Switch to Expert Mode</b> →{" "}
          <b>Create an account without a campaign</b> (chưa phải chạy quảng cáo hay nhập thanh toán). Tiền tệ chọn <b>VND</b> — không
          đổi được về sau.
        </p>
        <ol>
          <li>
            Menu trái <b>Goals (Mục tiêu)</b> → <b>Conversions</b> → <b>Summary</b> → <b>+ Create conversion action</b>.
          </li>
          <li>
            Chọn <b>Website</b> → màn hình <b>Measure conversions on your website</b>: nhập tên miền (Google không quét được{" "}
            <code>localhost</code>).
          </li>
          <li>
            Mục <b>Choose data sources</b>: tick <b>Google tag</b> (Google tạo Google tag của tài khoản Ads, ID dạng{" "}
            <code>GTM-…</code> + <code>AW-…</code>). <b>Chưa bấm Link</b> property GA4 — tránh mỗi đơn bị tính 2 lần. Hiện “Not installed
            yet” hay lỗi “Something went wrong” → đóng thông báo, bấm <b>Done</b> vẫn đi tiếp được.
          </li>
          <li>Tạo conversion action <b>thủ công</b> (manually) và điền:</li>
          <li style={{ listStyle: "none" }}>
            <p className="text-sm text-muted">
              Ý nghĩa từng ô: <Link href="/lab/glossary#ads" className="text-accent underline">Từ điển → Google Ads</Link>.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Ô</th>
                  <th>Chọn</th>
                  <th>Vì sao</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Goal and action optimization</td><td><b>Purchase</b></td><td>Loại chuyển đổi</td></tr>
                <tr><td>Conversion name</td><td><code>Purchase - Nha Moc lab</code></td><td>Tên dễ nhận</td></tr>
                <tr>
                  <td>Value</td>
                  <td>
                    <b>Use different values for each conversion</b> → Set up using: <b>Event snippet</b> (không bấm “Set up
                    conversion values”), mặc định <code>1</code> VND
                  </td>
                  <td>
                    Mỗi đơn một giá trị — tag GTM gửi kèm (<code>{"{{DLV - ecommerce.value}}"}</code>). Event snippet = giá trị đi
                    theo event, đúng cách GTM làm; <i>Google tag</i> là cách cấu hình lấy giá trị trên giao diện Google, không cần
                    code
                  </td>
                </tr>
                <tr><td>Count</td><td><b>Every</b></td><td>Mua hàng: đơn nào cũng tính</td></tr>
                <tr><td>Click-through conversion window</td><td>30 days</td><td>Mặc định</td></tr>
                <tr><td>Attribution</td><td>Data-driven</td><td>Mặc định</td></tr>
              </tbody>
            </table>
          </li>
          <li>
            Màn hình <b>“You are almost done!”</b> → tab <b>Use Google Tag Manager</b> → ghi lại <b>Conversion ID</b> (dãy số) và{" "}
            <b>Conversion Label</b> (chuỗi). <b>Đừng bấm</b> “Set up in Google Tag Manager” (để Google tạo hộ) — mình tự làm để hiểu.
            Kéo xuống → <b>Done</b>.
          </li>
        </ol>
        <Warn title="Tài khoản đang chạy quảng cáo thật?">
          <p>
            Vào cài đặt conversion action vừa tạo → đặt là <b>Secondary</b>, để đơn giả của lab không làm lệch việc tối ưu giá thầu.
          </p>
        </Warn>

        <h3>Bước 2 — Tag Conversion Linker</h3>
        <p>
          Đọc <code>gclid</code> trên URL khi khách click quảng cáo và lưu vào cookie <code>_gcl_aw</code> (90 ngày) — vài trang sau,
          vài ngày sau khách mới mua thì tag chuyển đổi vẫn biết họ đến từ click nào.
        </p>
        <ol>
          <li>Tags → <b>New</b> → tên <code>Conversion Linker</code> → loại <b>Conversion Linker</b> (để mặc định).</li>
          <li>Triggering → <b>All Pages</b> (hoặc Initialization - All Pages) → Save.</li>
        </ol>
        <p className="text-sm text-muted">
          GTM gắn nhãn <b>LEGACY</b> cho loại tag này vì Google tag (<code>AW-…</code>) giờ tự lưu gclid. Vẫn nên tạo trong bài để thấy
          cơ chế — không gây đếm trùng.
        </p>

        <h3>Bước 3 — Trigger riêng cho purchase</h3>
        <p>
          Triggers → <b>New</b> → tên <code>CE - purchase</code> → <b>Custom Event</b>, Event name <code>purchase</code> (không tick
          regex) → Save.
        </p>
        <Warn title="Đừng gắn tag Ads vào CE - ecommerce">
          <p>
            Trigger đó khớp cả 10 event (view_item, add_to_cart…) → Google Ads ghi nhận mỗi lần xem sản phẩm là một “mua hàng”, tối ưu
            sai hoàn toàn. Tương tự: đừng đặt lệnh <code>gtag(&apos;event&apos;, &apos;conversion&apos;, …)</code> trong layout — nó chạy ở{" "}
            <b>mọi trang</b>.
          </p>
        </Warn>

        <h3>Bước 4 — Tag Google Ads Conversion Tracking</h3>
        <ol>
          <li>Tags → <b>New</b> → tên <code>Ads - Conversion - Purchase</code> → <b>Google Ads</b> → <b>Google Ads Conversion Tracking</b>.</li>
          <li>
            Điền (chọn biến bằng biểu tượng viên gạch ➕):
            <table>
              <thead>
                <tr>
                  <th>Ô</th>
                  <th>Giá trị</th>
                  <th>Để làm gì</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Conversion ID</td><td>số ở Bước 1</td><td>Tài khoản Ads nhận</td></tr>
                <tr><td>Conversion Label</td><td>chuỗi ở Bước 1</td><td>Đúng conversion action “Purchase”</td></tr>
                <tr><td>Conversion Value</td><td><code>{"{{DLV - ecommerce.value}}"}</code></td><td>Tính ROAS</td></tr>
                <tr>
                  <td>Transaction ID</td>
                  <td><code>{"{{DLV - ecommerce.transaction_id}}"}</code></td>
                  <td>Google Ads bỏ chuyển đổi trùng mã — lớp chống trùng thứ 2 sau Bài 5</td>
                </tr>
                <tr><td>Currency Code</td><td><code>{"{{DLV - ecommerce.currency}}"}</code></td><td>Quy đổi đúng tiền tệ</td></tr>
              </tbody>
            </table>
          </li>
          <li>Triggering → <b>chỉ</b> <code>CE - purchase</code> → Save.</li>
          <li>
            Cần một <b>Google Tag</b> cho Ads: Tag ID <code>AW-&lt;Conversion ID&gt;</code>, trigger <b>Initialization - All Pages</b>,
            tên <code>Google Tag - Ads</code>. Xem danh sách Tags trước: Google Ads thường <b>đã tự tạo</b> tag{" "}
            <code>Google Ads AW-…</code> khi bạn tick “Google tag” ở Bước 1 → giữ <b>một</b> cái (đổi tên cho dễ nhận), đừng tạo thêm.
          </li>
          <li>Bấm <b>Preview</b>.</li>
        </ol>

        <Warn title="Thấy hit “User provided data” trong Tag Assistant?">
          <p>
            Google tag đang tự dò email/SĐT trong form checkout và gửi đi dù người dùng chưa đồng ý. Tắt “Automatically detect
            user-provided data” ngay — cách làm ở <a href="#bai-8" className="text-accent underline">Bài 8, mục 3</a>.
          </p>
        </Warn>

        <h3>Bước 5 — Thử như khách đến từ quảng cáo</h3>
        <ol>
          <li>
            Mở <Link href="/lab/ads" className="text-accent underline">Mô phỏng click Ads</Link> → chọn chiến dịch → giữ{" "}
            <b>Auto-tagging</b> bật → <b>Click quảng cáo → landing</b>. URL mới có <code>utm_…</code> và <code>gclid=…</code>.
          </li>
          <li>
            <b>F12 → Application → Cookies → localhost</b>: thấy cookie <code>_gcl_aw</code> (dạng <code>GCL.1732….&lt;gclid&gt;</code>)
            → Conversion Linker đã chạy.
          </li>
          <li>Mua hàng → thanh toán → chọn “Thanh toán thành công”.</li>
        </ol>
        <table>
          <thead>
            <tr>
              <th>Ở đâu</th>
              <th>Phải thấy</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Mốc Initialization / Container Loaded</td><td><code>Conversion Linker</code> ở Fired</td></tr>
            <tr><td>Mốc view_item, add_to_cart…</td><td><code>Ads - Conversion - Purchase</code> ở <b>Not Fired</b></td></tr>
            <tr><td>Mốc purchase</td><td><code>Ads - Conversion - Purchase</code> ở <b>Fired</b>, đúng 1 lần</td></tr>
            <tr><td>Mốc purchase → bấm vào tag Ads</td><td>Value = số tiền, Transaction ID = <code>NM-…</code>, Currency = <code>VND</code></td></tr>
            <tr><td>Reload trang status</td><td>Không có purchase mới → tag Ads không fire lại</td></tr>
            <tr><td>Đơn “Thẻ bị từ chối”</td><td>Tag Ads <b>không</b> fire</td></tr>
          </tbody>
        </table>
        <Warn title="Không thấy chip Ads riêng? Nó nằm trong chip GTM">
          <p>
            Hàng chip trên cùng chỉ có <code>GTM-…</code> và <code>G-…</code> là bình thường. Google tag của Ads được tải{" "}
            <b>bên trong</b> container GTM (tag <code>Google Tag - Ads</code>) nên Tag Assistant gộp nó vào chip GTM:
          </p>
          <ul>
            <li>
              Chip <code>GTM-…</code> có thêm <b>biểu tượng chữ A</b> (logo Google Ads) bên cạnh.
            </li>
            <li>
              Bấm chip GTM → <b>Container Details</b> → <b>Destination ID</b> = <code>AW-&lt;Conversion ID&gt;</code> — đúng tài khoản
              Ads của bạn.
            </li>
            <li>
              Xem hit gửi cho Ads: bấm mốc <b>purchase</b> ở cột trái (không phải Summary) → vẫn ở chip GTM → tab <b>Hits Sent</b> (bấm
              biểu tượng A nếu muốn lọc riêng hit Ads) → mở hit conversion: <code>label</code> = Conversion Label của action,{" "}
              <code>value</code> = số tiền, <code>currency_code</code> = <code>VND</code>, <code>oid</code> = mã đơn <code>NM-…</code>.
            </li>
          </ul>
          <p>
            Chip <code>G-…</code> riêng là GA4 (được tải bằng Google tag riêng). Một chip riêng <code>GTM-…</code> lạ (không phải
            container của bạn) là container Google tag Google tự tạo — đừng xoá.
          </p>
        </Warn>
        <Warn title="“Fired 2 times” ở Summary có phải bị trùng?">
          <p>
            <b>Summary</b> cộng dồn mọi mốc trong phiên Preview: mua 2 đơn thì tag Ads ghi “Fired 2 times” là đúng. Muốn biết có trùng
            không, bấm <b>từng mốc purchase</b>: mỗi mốc tag Ads chỉ được fire <b>1 lần</b>. Fire 2 lần ở cùng một mốc → tag đang gắn
            thêm trigger khác ngoài <code>CE - purchase</code>. Tạo conversion action mới thì nhớ thay <b>Conversion Label</b> mới
            vào tag — label cũ sẽ đổ dữ liệu vào action cũ.
          </p>
        </Warn>
        <p className="text-sm text-muted">
          gclid trong lab là giả nên Google Ads <b>không</b> hiện chuyển đổi trong báo cáo — bài này để thấy cơ chế và kiểm tra tag
          đúng. Sau khi Publish GTM và có người vào tên miền thật, conversion action chuyển từ <i>Unverified</i> sang có tín hiệu tag;
          chuyển đổi thật chỉ có khi có click quảng cáo thật.
        </p>
        <Check
          items={[
            "Cookie _gcl_aw xuất hiện sau khi click quảng cáo giả.",
            "Conversion Linker fire ở mọi trang.",
            "Tag Ads Conversion fire đúng 1 lần ở purchase, với Value, Transaction ID, Currency có giá trị.",
            "Chip GTM có biểu tượng A, Destination ID = AW-…; Hits Sent ở mốc purchase có 1 hit conversion với label đúng của action.",
            "Không fire ở event khác, không fire khi reload hay khi thẻ bị từ chối.",
          ]}
        />

        <h3>Bước 6 — Tạo chiến dịch Search (luyện giao diện, KHÔNG Publish)</h3>
        <Warn title="Đi hết các bước rồi thoát — đừng bấm Publish">
          <p>
            Website lab là cửa hàng demo: có giá, có nút mua nhưng không bán thật. Chạy quảng cáo trỏ về đây dễ bị khoá tài khoản vì{" "}
            <b>Misrepresentation</b>. Google tự lưu bản nháp (draft) sau mỗi bước — học xong thì đóng lại. Website bán hàng thật làm
            y hệt, chỉ khác URL và conversion action.
          </p>
        </Warn>
        <p className="text-sm text-muted">
          Giao diện Google Ads thay đổi thường xuyên; tên dưới đây theo giao diện tiếng Anh cuối 2026. Một số mục (EU political ads,
          AI Max…) có thể nằm ở bước khác hoặc không hiện với tài khoản của bạn.
        </p>
        <ol>
          <li>
            <b>Campaigns</b> → nút <b>+</b> → <b>New campaign</b> (có tài khoản hiện là <b>Create → Campaign</b>).
          </li>
          <li>
            <b>Choose an objective</b> → <b>Sales</b> (mục tiêu mua hàng). <b>Select a campaign type</b> → <b>Search</b>.
          </li>
          <li>
            Trang đầu tiên của chiến dịch:
            <ul>
              <li><b>Campaign name</b>: đặt theo quy ước dễ lọc, vd. <code>NM-Search-Sofa-VN</code> (thương hiệu – loại – nhóm hàng – vùng).</li>
              <li>
                <b>Use these conversion goals for campaign performance optimization</b>: giữ <b>Purchases (account default)</b> — bắt
                buộc có ít nhất 1 mục tiêu. Đây là conversion action <code>Purchase - Nha Moc lab</code> ở Bước 1. Dấu ⚠ cạnh “1
                action” thường là <i>No recent conversions</i> hoặc <i>Unverified</i> — di chuột để xem, không chặn việc tạo chiến
                dịch. Lead / Get directions để Secondary nên không nằm ở đây.
              </li>
              <li>
                <b>Select the results you want to get from this campaign</b>: tick <b>Website visits</b> → URL trang chủ. Không tick{" "}
                <b>Phone calls</b> (trừ khi muốn nút gọi trên quảng cáo). → <b>Continue</b>.
              </li>
            </ul>
          </li>
          <li>
            <b>Bidding</b> → <b>What do you want to focus on?</b>
            <table>
              <thead>
                <tr><th>Tình huống</th><th>Chọn</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Website mới, chưa có chuyển đổi</td>
                  <td><b>Conversions</b> (= Maximize conversions), hoặc <b>Clicks</b> + đặt giới hạn CPC tối đa nếu muốn kiểm soát giá mỗi click</td>
                </tr>
                <tr>
                  <td>Đã có đều đặn khoảng 15–30 đơn/30 ngày</td>
                  <td><b>Conversion value</b> + <b>Target ROAS</b> (vì đơn có giá trị khác nhau), hoặc <b>Conversions</b> + <b>Target CPA</b></td>
                </tr>
              </tbody>
            </table>
            <span className="text-sm text-muted">
              Ô <i>Customer acquisition</i> (trả giá cao hơn cho khách mới) nếu có: để trống ở chiến dịch đầu — cần Google Ads biết
              ai là khách cũ, phần nâng cao.
            </span>
          </li>
          <li>
            <b>Campaign settings</b>:
            <ul>
              <li>
                <b>Networks</b>: bỏ tick <b>Display Network</b> (quảng cáo chữ hiện trên các website khác — tốn tiền, ít mua).{" "}
                <b>Google Search Partners</b>: chiến dịch đầu nên bỏ tick để số liệu chỉ từ Google Search.
              </li>
              <li>
                <b>Locations</b>: Vietnam hoặc chỉ các tỉnh/thành bạn giao hàng. <b>Location options</b> → <b>Presence</b> (người đang ở
                hoặc thường ở đó) thay vì mặc định <i>Presence or interest</i> (cả người ở nơi khác chỉ quan tâm).
              </li>
              <li><b>Languages</b>: Vietnamese + English (nhiều người dùng điện thoại cài tiếng Anh).</li>
              <li>
                <b>Audience segments</b>: thêm <code>Bỏ giỏ 14 ngày</code> (<a href="#bai-10" className="text-accent underline">Bài 10</a>)
                ở chế độ <b>Observation</b> — vẫn hiện cho mọi người, chỉ theo dõi riêng nhóm này.
              </li>
              <li>
                Câu hỏi <b>EU political ads</b> (nếu có): chọn <b>No</b>.
              </li>
              <li><b>More settings</b>: ngày bắt đầu/kết thúc, <b>Ad schedule</b> (khung giờ chạy) — có thể bỏ qua.</li>
            </ul>
          </li>
          <li>
            <b>AI Max for Search campaigns</b> — <b>bật sẵn</b> với chiến dịch Search mới. Gồm 3 phần:
            <ul>
              <li><b>Search term matching</b>: tự mở rộng ra cả các từ khoá bạn không nhập.</li>
              <li><b>Text customization</b>: tự viết thêm tiêu đề/mô tả từ trang web của bạn.</li>
              <li><b>Final URL expansion</b>: tự chọn trang đích khác trên website thay cho URL bạn đặt.</li>
            </ul>
            <span className="text-sm text-muted">
              Gợi ý: chiến dịch đầu tiên, ngân sách nhỏ → <b>tắt</b> để biết chính xác quảng cáo hiện với từ khoá nào, dẫn về trang nào.
              Bật lại khi đã có dữ liệu chuyển đổi — Google cũng nói các tính năng này cần chiến lược giá thầu theo chuyển đổi mới chạy
              tốt.
            </span>
          </li>
          <li>
            <b>Keywords and ads</b> (Ad group):
            <ul>
              <li>Ad group name theo nhóm sản phẩm, vd. <code>Sofa gỗ</code>. Mỗi ad group một chủ đề.</li>
              <li>
                <b>Keywords</b> mỗi dòng 1 từ khoá, 5–15 từ. Kiểu khớp: <code>sofa gỗ</code> (broad — mặc định, rộng nhất),{" "}
                <code>&quot;sofa gỗ&quot;</code> (phrase), <code>[sofa gỗ óc chó]</code> (exact).
              </li>
              <li>
                Quảng cáo (Responsive search ad): <b>Final URL</b> = trang sản phẩm/danh mục khớp từ khoá (không phải luôn là trang chủ);{" "}
                <b>Display path</b> vd. <code>sofa/go-oc-cho</code>; <b>Headlines</b> tối đa 15, mỗi cái ≤ 30 ký tự (viết ít nhất 8–10);{" "}
                <b>Descriptions</b> tối đa 4, mỗi cái ≤ 90 ký tự. Xem <b>Ad strength</b> bên phải, nhắm mức Good/Excellent.
              </li>
              <li>
                <b>Assets</b>: <b>Sitelinks</b> (link phụ: Sofa, Bàn ăn, Showroom…), <b>Callouts</b> (“Giao hàng toàn quốc”, “Bảo
                hành 5 năm” — chỉ ghi điều có thật), <b>Call</b>, <b>Location</b> (cần Business Profile —{" "}
                <a href="#bai-11" className="text-accent underline">Bài 11</a>), <b>Images</b>.
              </li>
            </ul>
          </li>
          <li>
            <b>Budget</b>: ngân sách <b>trung bình mỗi ngày</b>. Có ngày Google tiêu tới gấp đôi, nhưng cả tháng không vượt khoảng 30,4
            lần ngân sách ngày.
          </li>
          <li>
            <b>Review</b>: Google liệt kê lỗi cần sửa (thiếu từ khoá, URL sai, <b>Billing</b> chưa cài…) với nút <b>Fix it</b>. Chạy
            thật thì cài thanh toán rồi bấm <b>Publish campaign</b>; quảng cáo thường được duyệt trong khoảng 1 ngày làm việc.{" "}
            <b>Lab: dừng ở đây, đóng lại.</b>
          </li>
        </ol>
        <p className="text-sm text-muted">
          Sau khi chạy thật: kiểm tra <b>Insights and reports → Search terms</b> mỗi tuần, thêm từ không liên quan vào{" "}
          <b>Negative keywords</b> (vd. <code>cũ</code>, <code>thanh lý</code>, <code>tự đóng</code>); trong Bài 6 tag Ads đã đo
          purchase nên cột Conversions sẽ có số.
        </p>

        <p className="text-sm text-muted">
          Đo thêm đăng ký email (<code>generate_lead</code>), tạo tài khoản (<code>sign_up</code>) và chạy quảng cáo nhắm lại người bỏ
          giỏ: xem <a href="#bai-10" className="text-accent underline">Bài 10</a>.
        </p>

        <h3>Tự kiểm tra hiểu bài</h3>
        <ul>
          <li>Xoá tag Conversion Linker rồi mua sau khi click quảng cáo giả — còn cookie <code>_gcl_aw</code> không? Google Ads ghép đơn với click bằng gì?</li>
          <li>Vì sao Count chọn <b>Every</b> cho mua hàng nhưng <b>One</b> cho lead?</li>
          <li>Gửi Value <b>gồm</b> phí ship thì ROAS trên Google Ads sai theo hướng nào?</li>
        </ul>
      </Lesson>

      <Lesson id="bai-7">
        <p>
          Luật Bảo vệ dữ liệu cá nhân yêu cầu người dùng <b>đồng ý trước</b> khi bạn ghi cookie thống kê/quảng cáo. Consent Mode v2
          báo cho các tag Google biết người dùng đã đồng ý gì. <b>Phải làm bài này trước khi đưa site lên tên miền thật.</b>
        </p>
        <h3>1. Mặc định từ chối — trong app/layout.tsx</h3>
        <Code>{B7_CONSENT}</Code>
        <h3>2. Khi người dùng bấm banner — components/ConsentBanner.tsx</h3>
        <Code>{B7_BANNER}</Code>
        <p className="text-sm text-muted">
          Banner, checkbox và nơi lưu lựa chọn (<code>lab_consent_ui</code> trong localStorage) đã làm sẵn — bạn chỉ báo lựa chọn cho
          Google. 4 loại consent: <code>analytics_storage</code> (cookie GA4), <code>ad_storage</code> (cookie quảng cáo),{" "}
          <code>ad_user_data</code> (gửi dữ liệu người dùng cho Google Ads — Bài 8), <code>ad_personalization</code> (remarketing).
        </p>
        <h3>Trong GTM</h3>
        <p>
          Admin → Container Settings → tick <b>Enable consent overview</b>. Các tag Google tự tuân theo consent; tag ngoài Google
          (Facebook, TikTok…) phải đặt “Require additional consent”.
        </p>
        <p className="text-sm text-muted">
          Cách trên là <b>Advanced consent mode</b>: khi bị từ chối, tag Google vẫn chạy nhưng <b>không ghi cookie</b>, chỉ gửi tín hiệu
          ẩn danh (tham số <code>gcs=G100</code> trong hit; đồng ý hết thì <code>G111</code>). Muốn chặt hơn (<b>Basic</b>): không cho tag
          Google nào chạy trước khi đồng ý — dùng trigger <code>consent_update</code> hoặc “Require additional consent”.
        </p>
        <Check
          items={[
            "Cửa sổ ẩn danh → bấm “Từ chối tất cả” → DevTools → Cookies: KHÔNG có _ga, _gcl_*.",
            "Bấm “Cài đặt cookie” ở chân trang → “Chấp nhận tất cả” → có cookie _ga.",
            "Tag Assistant → tab Consent: On-page Default = Denied; sau khi chấp nhận, On-page Update = Granted.",
            "Hits Sent khi đang từ chối: hit vẫn có nhưng tham số gcs=G100 (không cookie).",
          ]}
        />
      </Lesson>

      <Lesson id="bai-8">
        <p>
          Enhanced Conversions gửi kèm email/SĐT của người mua (Google tự mã hoá SHA-256) để Google Ads đối chiếu chuyển đổi chính xác
          hơn khi cookie bị chặn. Chỉ được gửi khi người dùng <b>tích ô đồng ý riêng</b> ở checkout <b>và</b> đã cho phép{" "}
          <code>ad_user_data</code> ở banner cookie — nên phải làm <a href="#bai-7" className="text-accent underline">Bài 7</a> trước.
        </p>

        <h3>1. Code — chỉ thêm user_data khi được phép</h3>
        <p>
          <b>Thay cả hàm</b> <code>trackPurchase</code> của Bài 5 bằng bản dưới — đừng dán thêm một lần push nữa, nếu không mỗi đơn sẽ
          có 2 event <code>purchase</code> (một cái rỗng, không có <code>transaction_id</code>).
        </p>
        <Code>{B8_USERDATA}</Code>
        <p className="text-sm text-muted">
          Chuẩn hoá trước khi gửi: email viết thường, bỏ khoảng trắng (email mẫu cố ý là <code>Nguyen.An@Example.com </code>); SĐT dạng
          quốc tế <code>+84…</code>. Tên trường chuẩn: <Link href="/lab/glossary#user-data" className="text-accent underline">Từ điển → user_data</Link>.
        </p>

        <h3>2. Google Ads — bật Enhanced conversions (giao diện 2026)</h3>
        <ol>
          <li>
            Menu trái <b>Goals</b> → <b>Settings</b>. Không thấy mục Settings? Mở thẳng{" "}
            <code className="break-all">ads.google.com/aw/conversions/customersettings</code> (đang đăng nhập đúng tài khoản Ads).
          </li>
          <li>
            Mở khung <b>Customer data use</b> → tick <b>Turn on enhanced conversions</b>. <b>Không</b> cần tick “Turn on
            conversion-based customer lists”.
          </li>
          <li>
            <b>Agree and save</b> → đọc điều khoản xử lý dữ liệu (Google Ads Data Processing Terms) → <b>Agree and continue</b>.
          </li>
        </ol>
        <p className="text-sm text-muted">
          Từ giữa 2026 Google gộp Enhanced conversions for web và for leads thành <b>một công tắc bật/tắt</b>, không còn bước chọn
          phương thức (Google tag / Google Tag Manager / API). Tài khoản nào vẫn hiện ô chọn phương thức thì chọn{" "}
          <b>Google Tag Manager</b>. Giao diện còn có thể đổi — tra “Set up enhanced conversions for web using Google Tag Manager” trên
          Google Ads Help.
        </p>

        <h3>3. Google tag — cho phép nhận dữ liệu, nhưng KHÔNG tự dò form</h3>
        <ol>
          <li>
            Mở cài đặt Google tag của Ads: Tag Assistant → mục <b>Tag Settings</b> → <b>Allow user-provided data capabilities</b>; hoặc
            Google Ads → <b>Tools</b> → <b>Data manager</b> → <b>Google tag</b> → <b>Manage</b>.
          </li>
          <li>
            Bật <b>Allow user-provided data capabilities</b>, nhưng <b>tắt</b> “Automatically detect user-provided data” — nếu không, Google
            tag tự quét form checkout và gửi email/SĐT dù người dùng chưa tích ô đồng ý.
          </li>
        </ol>

        <h3>4. GTM — gắn user_data vào tag Ads Conversion (Bài 6)</h3>
        <ol>
          <li>
            Tạo biến <code>DLV - user_data</code>: Data Layer Variable, tên <code>user_data</code>, Version 2.
          </li>
          <li>
            Tạo biến <code>UPD - user_data</code>: Variables → New → loại <b>User-Provided Data</b> → chọn <b>Code</b> → Data source:{" "}
            <code>{"{{DLV - user_data}}"}</code> (object có sẵn <code>email</code>, <code>phone_number</code>). Cách khác:{" "}
            <b>Manual configuration</b> → Email = <code>{"{{DLV - user_data.email}}"}</code>, Phone ={" "}
            <code>{"{{DLV - user_data.phone_number}}"}</code>.
          </li>
          <li>
            Mở tag <code>Ads - Conversion - Purchase</code> → mục <b>Event Parameters</b> → <b>Add parameter</b> → Event Parameter:{" "}
            <code>user_data</code>, Value: <code>{"{{UPD - user_data}}"}</code>. (GTM bản cũ có ô tick “Include user-provided data from
            your website” — bản mới đã bỏ, thay bằng tham số này.)
          </li>
          <li>Save tag → Preview.</li>
        </ol>
        <Check
          items={[
            "Đặt hàng KHÔNG tích ô Enhanced Conversions → dataLayer purchase không có user_data.",
            "Tích ô + đã “Chấp nhận tất cả” cookie → purchase có user_data (email viết thường, SĐT +84…).",
            "Tag Assistant, mốc purchase → tab Variables: UPD - user_data có email/SĐT; bấm hit Google Ads thấy dữ liệu người dùng đã được mã hoá (không phải email thô).",
            "Không có hit “User provided data” nào trước khi người dùng đồng ý.",
          ]}
        />
      </Lesson>

      <Lesson id="bai-9">
        <ol>
          <li>
            Dọn container: mỗi ID chỉ một Google tag (xoá tag Google tự tạo bị trùng), tag Ads Conversion chỉ chạy ở{" "}
            <code>CE - purchase</code>, đã tắt tự dò user-provided data. <b>Admin → Export Container</b> để sao lưu.
          </li>
          <li>GTM → <b>Submit</b> → đặt tên version (vd. “v1 – GA4 ecommerce + Ads purchase”) → <b>Publish</b>. Chưa Publish thì tag chỉ chạy trong Preview.</li>
          <li>Điền thông tin người vận hành trong <code>lib/site-config.ts</code> (các trang chính sách báo đỏ nếu thiếu).</li>
          <li>Vercel → Settings → Environment Variables: <code>NEXT_GTM_ID</code> = ID container → Redeploy.</li>
          <li>Trên tên miền thật: Preview GTM với URL mới, kiểm tra lại cả Bài 7 (cửa sổ ẩn danh, từ chối → không có cookie _ga).</li>
          <li>
            GA4 → Admin → <b>Data filters</b> → bật filter <b>Developer traffic</b> (Active) để dữ liệu khi Preview/tập luyện không lẫn vào
            báo cáo; hoặc dùng property GA4 riêng cho localhost (Lookup Table theo <code>{"{{Page Hostname}}"}</code>, Bài 3.5).
          </li>
          <li>
            Mỗi khi thêm tag mới, cập nhật bảng trong <Link href="/cookies" className="text-accent underline">Chính sách cookie</Link>.
          </li>
        </ol>
        <p>
          Không chạy quảng cáo Google Ads thật có lời chào bán/giá/khuyến mại trỏ về cửa hàng demo — dễ bị khoá tài khoản vì vi phạm
          chính sách Misrepresentation.
        </p>
      </Lesson>
      <Lesson id="bai-10">
        <p>
          Mua hàng không phải hành động duy nhất đáng đo. Bài này đo thêm <b>đăng ký nhận email</b> (<code>generate_lead</code>),{" "}
          <b>tạo tài khoản</b> (<code>sign_up</code>), <b>đăng nhập</b> (<code>login</code>) — rồi dùng chính dữ liệu Bài 4–5 để{" "}
          <b>chạy quảng cáo nhắm lại người đã thêm giỏ mà chưa mua</b>.
        </p>

        <h3>1. Code — 4 chỗ TODO Bài 10</h3>
        <p>
          Form email ở chân trang và trang <Link href="/register" className="text-accent underline">/register</Link> (link “Tài khoản”
          trên header) đã làm sẵn — trang đăng ký không có mật khẩu, tài khoản chỉ lưu trong trình duyệt.
        </p>
        <Code>{B10_LEAD}</Code>
        <Code>{B10_SIGNUP}</Code>
        <Code>{B10_SIGNUP_LEAD}</Code>
        <Code>{B10_LOGIN}</Code>
        <p className="text-sm text-muted">
          Mỗi khối code = <b>một</b> chỗ TODO — dán đúng chỗ, đừng dán cả khối vào một chỗ (sẽ push trùng).
        </p>
        <ul>
          <li>Push khi hành động <b>thành công</b> (sau khi “API” trả về), giống purchase.</li>
          <li>
            <b>Không</b> đưa email, tên, SĐT vào các event này. Muốn GA4 nhận ra người đã đăng nhập trên nhiều thiết bị thì dùng{" "}
            <code>user_id</code> = mã nội bộ (trang /register hiện mã dạng <code>u_…</code>) — phần nâng cao, cài trong Configuration
            settings của Google Tag.
          </li>
          <li>Tên event và tham số là tên chuẩn GA4 — xem <Link href="/lab/glossary#ten-chuan-khac" className="text-accent underline">Từ điển</Link>.</li>
        </ul>

        <h3>2. GTM — 2 tag riêng (không dùng tag ecommerce)</h3>
        <p>
          Các event này <b>không có object <code>ecommerce</code></b> nên tag <code>GA4 - Event - ecommerce</code> không dùng được. Tạo
          biến đọc tham số ở <b>cấp ngoài cùng</b>:
        </p>
        <table>
          <thead>
            <tr>
              <th>Biến</th>
              <th>Data Layer Variable Name</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>DLV - lead_source</code></td><td><code>lead_source</code></td></tr>
            <tr><td><code>DLV - value</code></td><td><code>value</code> (khác <code>ecommerce.value</code>)</td></tr>
            <tr><td><code>DLV - currency</code></td><td><code>currency</code></td></tr>
            <tr><td><code>DLV - method</code></td><td><code>method</code></td></tr>
          </tbody>
        </table>
        <ol>
          <li>
            Trigger <code>CE - generate_lead</code> (Custom Event <code>generate_lead</code>) → tag <code>GA4 - Event - generate_lead</code>:
            GA4 Event, Measurement ID <code>{"{{CONST - GA4 ID}}"}</code>, Event Name <code>generate_lead</code>, Event Parameters:{" "}
            <code>lead_source</code>, <code>value</code>, <code>currency</code> = 3 biến trên.
          </li>
          <li>
            Trigger <code>CE - account</code> (Custom Event, regex <code>^(sign_up|login)$</code>) → tag <code>GA4 - Event - account</code>:
            Event Name <code>{"{{Event}}"}</code>, Event Parameter <code>method</code> = <code>{"{{DLV - method}}"}</code>.
          </li>
        </ol>
        <Warn title="Vì sao tách 2 tag, không gộp 1 tag cho cả 3 event?">
          <p>
            dataLayer <b>nhớ</b> giá trị của lần push trước. Sau một <code>generate_lead</code> (có <code>value: 50000</code>), nếu tag
            chung đọc <code>{"{{DLV - value}}"}</code> ở event <code>sign_up</code> thì vẫn ra 50000 → GA4 nhận sign_up kèm giá trị sai.
            Tách tag: mỗi tag chỉ đọc tham số mà event của nó luôn tự push.
          </p>
        </Warn>
        <p className="text-sm text-muted">
          Google Ads (tuỳ chọn): tạo conversion action <b>Submit lead form</b> và <b>Sign-up</b>, <b>Count = One</b>, đặt{" "}
          <b>Secondary</b> (purchase vẫn là mục tiêu tối ưu chính) → tag Ads Conversion riêng, trigger <code>CE - generate_lead</code>{" "}
          / <code>CE - account</code>.
        </p>

        <h3>3. GA4 — đánh dấu key event</h3>
        <p>
          Làm thử mỗi hành động 1 lần (event phải tới GA4 mới hiện trong danh sách) → GA4 → Admin → Data display → <b>Events</b> → bật{" "}
          <b>Mark as key event</b> cho <code>generate_lead</code> và <code>sign_up</code>.
        </p>
        <Check
          items={[
            "Gửi form email chân trang → generate_lead, lead_source = newsletter_footer, value là số.",
            "Tạo tài khoản bằng email / bằng Google → sign_up với method = email / google; tick “Nhận email ưu đãi” → thêm generate_lead (register_form).",
            "Đăng xuất → Đăng nhập lại → login.",
            "Không event nào chứa email hay tên.",
            "Tag Assistant: GA4 - Event - account ở sign_up/login gửi đúng method; GA4 - Event - generate_lead chỉ fire ở generate_lead.",
          ]}
        />

        <h3>4. Remarketing — quảng cáo cho người bỏ giỏ</h3>
        <Code>{B10_FLOW}</Code>
        <ol>
          <li>
            <b>Liên kết GA4 ↔ Google Ads</b>: GA4 → Admin → <b>Product links → Google Ads links → Link</b> → chọn tài khoản Ads → bật{" "}
            <b>Enable personalized advertising</b> → Submit. Sau khi link, <b>không</b> nhập <code>purchase</code> của GA4 làm chuyển
            đổi Primary trong Ads (tag Ads đã đo rồi — tránh đếm 2 lần).
          </li>
          <li>
            <b>Tạo Audience (Đối tượng) “Bỏ giỏ 14 ngày”</b> — tên menu ghi cả tiếng Anh / <i>tiếng Việt</i>:
            <ol>
              <li>
                GA4 → <b>Admin</b> (<i>Quản trị</i>) → <b>Data display</b> (<i>Hiển thị dữ liệu</i>) → <b>Audiences</b> (
                <i>Đối tượng</i>) → <b>New audience</b> (<i>Đối tượng mới</i>) → <b>Create a custom audience</b> (
                <i>Tạo đối tượng tuỳ chỉnh</i>).
              </li>
              <li>
                Góc trên bên trái, sửa “Untitled audience” (<i>Đối tượng không có tiêu đề</i>) thành <code>Bỏ giỏ 14 ngày</code>. Mô
                tả: “Đã thêm giỏ, chưa mua — 14 ngày”.
              </li>
              <li>
                Khung <b>Include users when</b> (<i>Bao gồm người dùng khi</i>) → <b>Add new condition</b> (
                <i>Thêm điều kiện mới</i>) → gõ tìm và chọn sự kiện <code>add_to_cart</code>. Phạm vi để mặc định{" "}
                <b>Across all sessions</b> (<i>Trên mọi phiên</i>). Muốn nhóm “nóng” hơn: dùng <code>begin_checkout</code>.
              </li>
              <li>
                Bấm <b>Add group to exclude</b> (<i>Thêm nhóm để loại trừ</i>) → chọn{" "}
                <b>Temporarily exclude users when</b> (<i>Tạm thời loại trừ người dùng khi</i>) → <b>Add new condition</b> → sự kiện{" "}
                <code>purchase</code>.
                <span className="text-sm text-muted">
                  {" "}“Tạm thời”: người vừa mua bị loại ra, nhưng nếu sau này lại thêm giỏ mà không mua thì vào lại danh sách.
                  “Vĩnh viễn” (<i>Permanently</i>): đã mua một lần là không bao giờ vào nữa — không hợp với bỏ giỏ.
                </span>
              </li>
              <li>
                <b>Membership duration</b> (<i>Thời hạn thành viên</i>) → <b>Set to maximum limit</b> bỏ chọn → nhập <b>14</b> ngày. Người
                bỏ giỏ “nguội” nhanh; quá 14 ngày không thêm giỏ lại thì tự rời danh sách.
              </li>
              <li>
                <b>Audience trigger</b> (<i>Trình kích hoạt đối tượng</i>): bỏ qua. → <b>Save</b> (<i>Lưu</i>).
              </li>
            </ol>
            <p className="text-sm text-muted">
              Khung <b>Summary</b> (<i>Tóm tắt</i>) bên phải ước tính số người khớp điều kiện — website tập luyện sẽ hiện rất ít hoặc
              “không đủ dữ liệu”, bình thường. Danh sách cần thời gian để đủ người nên <b>tạo sớm</b>; sau 24–48 giờ (khi đã liên kết GA4 ↔
              Ads) hiện trong Google Ads → <b>Tools → Shared library → Audience manager</b> với nguồn là Google Analytics.
            </p>
          </li>
          <li>
            Thêm vài nhóm hữu ích: <i>Xem sản phẩm chưa thêm giỏ</i> (<code>view_item</code>, loại <code>add_to_cart</code>),{" "}
            <i>Đăng ký email chưa mua</i> (<code>generate_lead</code>, loại <code>purchase</code>), <i>Đã mua 30 ngày</i> (để{" "}
            <b>loại trừ</b> khỏi quảng cáo khuyến mãi).
          </li>
        </ol>
        <table>
          <thead>
            <tr>
              <th>Chạy quảng cáo bằng</th>
              <th>Khi nào</th>
              <th>Cài đặt chính</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Display / Demand Gen</b></td>
              <td>Phổ biến nhất</td>
              <td>New campaign → Sales → Display/Demand Gen → Audience segments → Your data → <code>Bỏ giỏ 14 ngày</code> → <b>Targeting</b></td>
            </tr>
            <tr>
              <td><b>Dynamic remarketing</b></td>
              <td>Hiện đúng sản phẩm khách đã bỏ giỏ</td>
              <td>Cần Google Merchant Center; <code>item_id</code> trong event (vd. <code>SKU-SOFA-001</code>) phải khớp mã sản phẩm trong feed</td>
            </tr>
            <tr>
              <td><b>Search (RLSA)</b></td>
              <td>Khách quay lại tìm trên Google</td>
              <td>Thêm audience vào chiến dịch Search ở chế độ <b>Observation</b>, tăng giá thầu cho nhóm này</td>
            </tr>
            <tr>
              <td><b>Performance Max</b></td>
              <td>Để Google tự tối ưu</td>
              <td>Dùng audience làm <b>Audience signal</b> (gợi ý, không giới hạn cứng)</td>
            </tr>
          </tbody>
        </table>
        <ul>
          <li>Danh sách cần đủ lớn: khoảng <b>100</b> người dùng hoạt động/30 ngày cho Display, khoảng <b>1.000</b> cho Search.</li>
          <li>Luôn <b>loại trừ người đã mua</b>; đặt giới hạn tần suất (vd. 3 lần/ngày) để không làm phiền.</li>
          <li>
            Người đăng ký email đã <b>đồng ý nhận quảng cáo</b> có thể dùng thêm <b>Customer Match</b> (tải danh sách email lên Google
            Ads) — phải đúng chính sách Google và luật dữ liệu cá nhân.
          </li>
          <li>Chính sách bảo mật / cookie phải nói rõ có remarketing.</li>
        </ul>
        <Warn title="Lab: chỉ tạo Audience, KHÔNG chạy quảng cáo thật">
          <p>
            Cửa hàng demo có giá, nút mua nhưng không bán thật → chạy quảng cáo trỏ về đây dễ bị khoá tài khoản (Misrepresentation). Trên
            lab, bạn tạo được Audience và xem cài đặt; danh sách sẽ không đủ người để chạy. Áp dụng cho website thật.
          </p>
        </Warn>

        <h3>Tự kiểm tra hiểu bài</h3>
        <ul>
          <li>Vì sao đẩy <code>user_id</code> là mã nội bộ chứ không phải email?</li>
          <li>Audience “Bỏ giỏ 14 ngày” có tự loại người vừa mua hôm qua không? Nếu đặt Exclude là “Permanently” thì khác gì?</li>
          <li>Người đã bấm “Từ chối tất cả” cookie có vào danh sách remarketing không? Vì sao?</li>
        </ul>
      </Lesson>

      <Lesson id="bai-11">
        <p>
          Trang <Link href="/maps" className="text-accent underline">/maps</Link> (link “Showroom” trên header) là trang showroom: bản đồ,
          giờ mở cửa, nút <b>Chỉ đường</b> và <b>Gọi</b>. Bài này đo 2 nút đó <b>không cần viết code</b> — dùng trigger Click của GTM —
          rồi xem quảng cáo Google Maps hoạt động thế nào.
        </p>
        <Code>{B11_FLOW}</Code>
        <Warn title="Quảng cáo Maps cần showroom THẬT">
          <p>
            Quảng cáo trên Google Maps lấy địa chỉ từ <b>Google Business Profile đã xác minh</b>. Tạo Business Profile cho cửa hàng
            không có thật (như Nhà Mộc) là vi phạm quy định của Google — hồ sơ bị gỡ, tài khoản có thể bị khoá. Trên lab: làm phần
            GTM + GA4 + conversion; phần chạy quảng cáo (mục 5) áp dụng cho cửa hàng thật của bạn.
          </p>
        </Warn>

        <h3>1. Trang /maps có gì</h3>
        <Code>{B11_LINKS}</Code>
        <ul>
          <li>
            Hai nút là thẻ <code>&lt;a&gt;</code> bình thường → trigger <b>Click - Just Links</b> bắt được. Thuộc tính{" "}
            <code>data-store-id</code> cho biết khách bấm ở showroom nào.
          </li>
          <li>
            Link Chỉ đường dùng chuẩn <b>Maps URLs</b> (<code>google.com/maps/dir/?api=1&amp;destination=…</code>), không cần API key.
            Link Gọi dùng <code>tel:</code> — trên máy Mac có thể bật hộp thoại FaceTime, bấm Huỷ (số minh hoạ, không gọi được ai).
          </li>
          <li>
            Bản đồ nhúng chỉ tải khi bấm <b>Tải bản đồ</b> vì iframe Google Maps đặt cookie của Google — đã ghi vào{" "}
            <Link href="/cookies" className="text-accent underline">Chính sách cookie</Link>.
          </li>
        </ul>

        <h3>2. GTM — đo click không cần code</h3>
        <ol>
          <li>
            <b>Variables → Built-In Variables → Configure</b> → tick nhóm <b>Clicks</b>: <code>Click Element</code>,{" "}
            <code>Click URL</code>, <code>Click Text</code>.
          </li>
          <li>
            <b>User-Defined Variables → New</b> → loại <b>Auto-Event Variable</b> → Variable Type <b>Element Attribute</b> → Attribute
            name <code>data-store-id</code> → tên <code>AEV - store_id</code>.
          </li>
          <li>
            Trigger <code>Click - Chỉ đường</code>: loại <b>Click - Just Links</b> → bỏ tick <b>Wait for Tags</b> và{" "}
            <b>Check Validation</b> → <b>Some Link Clicks</b> → <code>Click URL</code> <b>contains</b>{" "}
            <code>google.com/maps/dir</code>.
          </li>
          <li>
            Trigger <code>Click - Gọi điện</code>: <b>Click - Just Links</b> → <b>Some Link Clicks</b> → <code>Click URL</code>{" "}
            <b>starts with</b> <code>tel:</code>.
          </li>
          <li>
            Tag <code>GA4 - Event - get_directions</code>: GA4 Event, Measurement ID <code>{"{{CONST - GA4 ID}}"}</code>, Event Name{" "}
            <code>get_directions</code>, Event Parameter <code>store_id</code> = <code>{"{{AEV - store_id}}"}</code>, trigger{" "}
            <code>Click - Chỉ đường</code>.
          </li>
          <li>
            Tag <code>GA4 - Event - click_to_call</code>: giống trên, Event Name <code>click_to_call</code>, trigger{" "}
            <code>Click - Gọi điện</code>.
          </li>
        </ol>
        <ul className="text-sm text-muted">
          <li>
            GA4 <b>không có tên chuẩn</b> cho 2 hành động này → tự đặt, giữ chữ thường + gạch dưới như tên chuẩn.
          </li>
          <li>
            Không trigger “All Link Clicks”: tag sẽ chạy ở <b>mọi</b> link (menu, sản phẩm…).
          </li>
          <li>
            GA4 <b>Enhanced measurement → Outbound clicks</b> vẫn tự ghi thêm event <code>click</code> cho link Chỉ đường (link ra
            google.com). Không trùng — khác tên event, nhưng chỉ <code>get_directions</code> có <code>store_id</code>.
          </li>
          <li>
            Trigger click dễ hỏng khi đổi giao diện (đổi link, đổi chữ). Website lớn nên dùng <code>dataLayer.push</code> như Bài 10;
            bài này dùng click để biết thêm cách làm không cần lập trình viên.
          </li>
        </ul>

        <h3>3. GA4 — thêm phương diện “Showroom”</h3>
        <ol>
          <li>
            GA4 → <b>Admin</b> (<i>Quản trị</i>) → <b>Data display</b> (<i>Hiển thị dữ liệu</i>) → <b>Custom definitions</b> (
            <i>Định nghĩa tuỳ chỉnh</i>) → <b>Create custom dimension</b> (<i>Tạo phương diện tuỳ chỉnh</i>).
          </li>
          <li>
            Dimension name <code>Showroom</code>, Scope <b>Event</b> (<i>Sự kiện</i>), Event parameter <code>store_id</code> → Save.
          </li>
          <li>
            Từ lúc tạo trở đi, báo cáo và Explore có thêm cột “Showroom” → biết showroom nào được bấm chỉ đường nhiều. Không áp dụng
            ngược cho dữ liệu cũ; cần 24–48 giờ mới thấy trong báo cáo.
          </li>
          <li>
            Tuỳ chọn: đánh dấu <code>get_directions</code> là <b>key event</b> (Admin → Events, như Bài 10).
          </li>
        </ol>

        <h3>4. Google Ads — conversion “Chỉ đường” trên website</h3>
        <p>
          Làm giống Bài 6 (Goals → Conversions → Summary → <b>+ Create conversion action</b> → Website → tạo thủ công), khác ở các ô:
        </p>
        <table>
          <thead>
            <tr>
              <th>Ô</th>
              <th>Chọn</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Goal and action optimization</td><td><b>Get directions</b></td></tr>
            <tr><td>Conversion name</td><td><code>Get directions - website</code></td></tr>
            <tr><td>Value</td><td>Không dùng giá trị, hoặc một con số ước tính cố định</td></tr>
            <tr><td>Count</td><td><b>One</b> — một người bấm 5 lần vẫn là một ý định đến showroom</td></tr>
            <tr><td>Primary / Secondary</td><td><b>Secondary</b> (chỉ theo dõi), trừ khi chiến dịch nhằm kéo khách tới cửa hàng</td></tr>
          </tbody>
        </table>
        <p>
          GTM: tag <b>Google Ads Conversion Tracking</b> với Conversion ID / Label mới, trigger <code>Click - Chỉ đường</code>. Gọi
          điện: tạo thêm action loại <b>Phone call lead</b> hoặc <b>Contact</b>, trigger <code>Click - Gọi điện</code>.
        </p>
        <Check
          items={[
            "Preview → /maps → bấm Chỉ đường: mốc Link Click, tag GA4 - Event - get_directions Fired, store_id = hn-hoan-kiem.",
            "Bấm Chỉ đường của showroom TP.HCM: store_id = hcm-quan-1.",
            "Bấm Gọi: chỉ GA4 - Event - click_to_call fire, get_directions không fire.",
            "Bấm link menu, sản phẩm: không tag nào của Bài 11 fire.",
            "DebugView: get_directions có tham số store_id.",
          ]}
        />

        <h3>5. Chạy quảng cáo Google Maps (cửa hàng thật)</h3>
        <ol>
          <li>
            <b>Google Business Profile</b> (business.google.com): tạo hồ sơ cho cửa hàng thật, đúng tên + địa chỉ + số điện thoại, và{" "}
            <b>xác minh</b> theo cách Google yêu cầu. Tên, địa chỉ, SĐT trên website (trang Showroom) nên khớp hồ sơ.
          </li>
          <li>
            Liên kết vào Google Ads: <b>Tools → Shared library → Location manager</b> → nút <b>+</b> → <b>Our locations</b> → Continue
            → <b>Google Business Profile</b> → chọn tài khoản Business Profile Manager → Continue → lọc theo tên nếu cần → <b>Save</b>.
            Các địa chỉ trở thành <b>location assets</b> (tiện ích vị trí).
          </li>
          <li>Tạo chiến dịch thuộc một trong các loại có thể hiện trên Maps (bảng dưới), đặt vùng nhắm quanh showroom.</li>
        </ol>
        <table>
          <thead>
            <tr>
              <th>Dạng quảng cáo trên Maps</th>
              <th>Hiện ở đâu</th>
              <th>Từ loại chiến dịch</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Promoted pins</b></td>
              <td>Ghim vuông trên bản đồ, cả dọc đường khi chỉ đường</td>
              <td>Performance Max (store goals), Demand Gen, Smart</td>
            </tr>
            <tr>
              <td><b>Map search ads</b></td>
              <td>Đầu danh sách kết quả khi tìm trên Maps</td>
              <td>Search có location assets, Performance Max (store goals), Smart, Shopping</td>
            </tr>
            <tr>
              <td><b>Map suggest ads</b></td>
              <td>Gợi ý khi đang gõ (chỉ app Google Maps)</td>
              <td>Search, Performance Max (store goals), Smart</td>
            </tr>
            <tr>
              <td><b>Placesheet ads</b></td>
              <td>Trong trang chi tiết một địa điểm</td>
              <td>Performance Max (store goals), Travel</td>
            </tr>
          </tbody>
        </table>
        <ul>
          <li>
            <b>Không chạy được quảng cáo CHỈ trên Maps</b> — chiến dịch luôn hiện cả trên Search, YouTube… Cách đơn giản nhất để bắt
            đầu: chiến dịch <b>Search</b> có location assets.
          </li>
          <li>
            Tiền: Search tính theo click (CPC) khi khách bấm chỉ đường, gọi, vào website. Ghim logo của Performance Max (store goals)
            thường tính theo lượt hiển thị.
          </li>
          <li>
            Bấm chỉ đường / gọi <b>ngay trên quảng cáo</b> do Google đo trong Google Ads (không qua GTM). <b>Store visits</b> (lượt
            đến cửa hàng) chỉ có khi tài khoản đủ điều kiện của Google — Google tự bật.
          </li>
          <li>
            Xem chi tiết:{" "}
            <a className="text-accent underline" href="https://support.google.com/google-ads/answer/16388390" target="_blank" rel="noreferrer">
              About advertising in Google Maps
            </a>
            ,{" "}
            <a className="text-accent underline" href="https://support.google.com/google-ads/answer/2404182" target="_blank" rel="noreferrer">
              About location assets
            </a>
            .
          </li>
        </ul>

        <h3>Tự kiểm tra hiểu bài</h3>
        <ul>
          <li>Vì sao trigger dùng “Some Link Clicks” chứ không “All Link Clicks”?</li>
          <li>Khách bấm Chỉ đường ngay trên ghim quảng cáo Maps, không vào website — GTM có thấy không? Ai đo?</li>
          <li>Tạo phương diện “Showroom” hôm nay thì dữ liệu tuần trước có cột này không?</li>
        </ul>
      </Lesson>
    </article>
  );
}
