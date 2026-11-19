import Link from "next/link";

export const metadata = { title: "Bài học GTM & Google Ads — từ đầu" };

/* ---------------- Code mẫu cho từng bài ---------------- */

const B1_ENV = `NEXT_GTM_ID=GTM-KLQVQN67`;

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

const B4_HELPER = `// lib/datalayer.ts — tự tạo file này để khỏi lặp code
import type { Product } from "./products";

export function toItem(p: Product, quantity = 1, variant?: string) {
  return {
    item_id: p.id,
    item_name: p.name,
    item_brand: p.brand,
    item_category: p.category,
    item_variant: variant,
    price: p.price,
    quantity,
  };
}

export function pushEcommerce(event: string, ecommerce: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ecommerce: { currency: "VND", ...ecommerce } });
}

// Dùng:  pushEcommerce("view_item", { value: p.price, items: [toItem(p)] });`;

const B5_PURCHASE = `// app/checkout/success/page.tsx — chỗ "TODO Bài 5"
// Nhớ import: saveLastOrder (từ "@/lib/lab-state"), pushEcommerce + toItem (từ "@/lib/datalayer")
if (order.tracked) return; // ✅ đã gửi rồi → reload trang không gửi lại

pushEcommerce("purchase", {
  transaction_id: order.transaction_id,
  value: order.value,
  shipping: order.shipping,
  coupon: order.coupon || undefined,
  items: /* tự viết: đổi order.items thành mảng item (gợi ý: getProductById + toItem) */ [],
});
saveLastOrder({ ...order, tracked: true });`;

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
window.dataLayer.push({ event: "consent_update" });`;

const B8_USERDATA = `// app/checkout/success/page.tsx — thêm vào object purchase, chỗ "TODO Bài 8"
// Nhớ import: consentStore (từ "@/lib/lab-state")
const allowed =
  order.ec_consent && consentStore.get().state.ad_user_data === "granted";

window.dataLayer.push({
  event: "purchase",
  ecommerce: { /* như Bài 5 */ },
  ...(allowed && {
    user_data: {
      email: order.customer.email.trim().toLowerCase(),
      phone_number: "+84" + order.customer.phone.replace(/\\D/g, "").replace(/^0/, ""),
    },
  }),
});`;

/* ---------------- Danh sách bài ---------------- */

const LESSONS = [
  ["bai-0", "Bài 0", "Bức tranh tổng thể & cách học"],
  ["bai-1", "Bài 1", "Nhúng GTM vào website"],
  ["bai-2", "Bài 2", "GA4: đếm lượt xem trang (không cần code)"],
  ["bai-3", "Bài 3", "Event đầu tiên: add_to_cart"],
  ["bai-4", "Bài 4", "Cả phễu mua hàng"],
  ["bai-5", "Bài 5", "purchase & chống đếm trùng"],
  ["bai-6", "Bài 6", "Google Ads: chuyển đổi mua hàng"],
  ["bai-7", "Bài 7", "Consent Mode v2 (bắt buộc trước khi public)"],
  ["bai-8", "Bài 8", "Enhanced Conversions"],
  ["bai-9", "Bài 9", "Publish & đưa lên mạng"],
] as const;

const FUNNEL: [string, string, string][] = [
  ["view_item_list", "components/ProductGrid.tsx (useTrackOnce)", "item_list_id, item_list_name, items"],
  ["select_item", "components/ProductGrid.tsx (onClick)", "item_list_id, items[1 sản phẩm]"],
  ["view_item", "app/products/[slug]/ProductDetail.tsx", "value, items"],
  ["view_cart", "app/cart/page.tsx", "value, items"],
  ["add_to_cart / remove_from_cart", "app/cart/page.tsx (changeQty)", "value, items"],
  ["begin_checkout", "app/checkout/page.tsx (useTrackOnce)", "value, coupon, items"],
  ["add_shipping_info", "app/checkout/page.tsx (submitInfo)", "+ shipping_tier"],
  ["add_payment_info", "app/checkout/page.tsx (placeOrder)", "+ payment_type"],
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
            Bí quá thì xem <b>đáp án</b> ở nhánh <code>dev</code> (bản làm sẵn), ví dụ:{" "}
            <code>git show dev:app/products/[slug]/ProductDetail.tsx</code>. Bản đáp án dùng hàm <code>trackEcommerce</code> trong{" "}
            <code>lib/tracking.ts</code> của nhánh đó.
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
        <h3>Trong GTM</h3>
        <p>
          Chưa cần tạo gì. Bấm <b>Preview</b> → nhập <code>http://localhost:3000</code> → <b>Connect</b>.
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
        <ol>
          <li>Vào analytics.google.com → tạo <b>property mới để học</b> → Data stream <b>Web</b> → lấy Measurement ID <code>G-XXXXXXX</code>.</li>
          <li>Trong Data stream, kiểm tra <b>Enhanced measurement</b> đang bật mục “Page changes based on browser history events” — cần cho website kiểu Next.js (chuyển trang không reload).</li>
          <li>GTM → Tags → New → <b>Google Tag</b> → Tag ID = <code>G-XXXXXXX</code> → Trigger <b>Initialization - All Pages</b> → Save.</li>
          <li>Bấm Preview lại, đi qua vài trang.</li>
        </ol>
        <Check
          items={[
            "Trong Tag Assistant, Google Tag nằm ở mục Tags Fired.",
            "GA4 → Admin → DebugView thấy page_view mỗi khi bạn chuyển trang.",
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
        <h3>Trong GTM</h3>
        <ol>
          <li>
            Variables → User-Defined → New → <b>Data Layer Variable</b>, tên <code>DLV - ecommerce.value</code>, Data Layer Variable
            Name: <code>ecommerce.value</code>.
          </li>
          <li>Triggers → New → <b>Custom Event</b>, Event name: <code>add_to_cart</code>.</li>
          <li>
            Tags → New → <b>Google Analytics: GA4 Event</b> → Measurement ID <code>G-XXXXXXX</code> → Event Name{" "}
            <code>add_to_cart</code> → More Settings → Ecommerce → tick <b>Send Ecommerce data</b> (Data Layer) → Trigger vừa tạo.
          </li>
        </ol>
        <Check
          items={[
            "Bấm “Thêm vào giỏ” → nút dataLayer hiện add_to_cart, không có ⚠.",
            "Tag Assistant: chọn event add_to_cart → tab Variables thấy DLV - ecommerce.value đúng số tiền; tag GA4 Event đã fire.",
            "GA4 DebugView thấy add_to_cart, mở ra có items.",
          ]}
        />
      </Lesson>

      <Lesson id="bai-4">
        <p>Lặp lại Bài 3 cho cả phễu. Nên tạo helper trước để code ngắn gọn:</p>
        <Code>{B4_HELPER}</Code>
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
        <h3>Trong GTM — gom tất cả vào 1 tag</h3>
        <ol>
          <li>
            Sửa trigger thành Event name:{" "}
            <code>^(view_item_list|select_item|view_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|add_shipping_info|add_payment_info)$</code>{" "}
            và tick <b>Use regex matching</b>.
          </li>
          <li>Trong tag GA4 Event, đổi Event Name thành <code>{"{{Event}}"}</code> (biến có sẵn — bật ở Variables → Configure).</li>
        </ol>
        <Check items={["Đi một vòng từ trang chủ tới nút Đặt hàng: đủ 9 event, không event nào bị trùng, không có ⚠."]} />
      </Lesson>

      <Lesson id="bai-5">
        <p>
          <code>purchase</code> là event quan trọng nhất — Google Ads tối ưu dựa vào nó. Nó phải có <code>transaction_id</code> và chỉ
          gửi <b>1 lần</b> cho mỗi đơn (người dùng hay reload trang cảm ơn).
        </p>
        <Code>{B5_PURCHASE}</Code>
        <p>
          Trong GTM: tạo thêm 2 Data Layer Variable <code>ecommerce.transaction_id</code>, <code>ecommerce.currency</code> và thêm{" "}
          <code>purchase</code> vào regex của trigger.
        </p>
        <Check
          items={[
            "Đặt hàng → thấy purchase với transaction_id dạng NM-…",
            "Reload trang cảm ơn → KHÔNG có purchase mới.",
            "GA4 DebugView thấy purchase; vài giờ sau báo cáo Monetization → Ecommerce purchases có doanh thu.",
          ]}
        />
      </Lesson>

      <Lesson id="bai-6">
        <ol>
          <li>Google Ads → Goals → Conversions → New → Website → tạo “Purchase”, chọn cài bằng Google Tag Manager → ghi lại <b>Conversion ID</b> và <b>Conversion Label</b>.</li>
          <li>GTM → Tag <b>Conversion Linker</b>, trigger <b>All Pages</b>. Tag này lưu mã click quảng cáo (<code>gclid</code>) vào cookie <code>_gcl_aw</code>.</li>
          <li>
            GTM → Tag <b>Google Ads Conversion Tracking</b>: Conversion ID/Label ở trên, Conversion Value ={" "}
            <code>{"{{DLV - ecommerce.value}}"}</code>, Transaction ID = <code>{"{{DLV - ecommerce.transaction_id}}"}</code>, Currency ={" "}
            <code>{"{{DLV - ecommerce.currency}}"}</code>. Trigger: Custom Event <code>purchase</code> (tạo trigger riêng).
          </li>
        </ol>
        <p>
          Thử: vào <Link href="/lab/ads" className="text-accent underline">Mô phỏng click Ads</Link> → click quảng cáo (URL có{" "}
          <code>gclid</code>) → DevTools → Application → Cookies thấy <code>_gcl_aw</code> → mua hàng.
        </p>
        <p className="text-sm text-muted">
          gclid trong lab là giả nên Google Ads sẽ không ghi nhận chuyển đổi thật — bài này để bạn thấy cơ chế và kiểm tra tag fire
          đúng. Bài tập thêm: push <code>generate_lead</code> ở form chân trang (tìm <code>TODO Bài 6</code>) và tạo chuyển đổi phụ.
        </p>
        <Check
          items={[
            "Conversion Linker fire ở mọi trang.",
            "Tag Ads Conversion fire đúng 1 lần ở purchase, tab Variables thấy value và transaction_id có giá trị.",
          ]}
        />
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
        <h3>Trong GTM</h3>
        <p>
          Admin → Container Settings → tick <b>Enable consent overview</b>. Các tag Google tự tuân theo consent; tag ngoài Google
          (Facebook, TikTok…) phải đặt “Require additional consent”.
        </p>
        <Check
          items={[
            "Cửa sổ ẩn danh → bấm “Từ chối tất cả” → DevTools → Cookies: KHÔNG có _ga, _gcl_*.",
            "Bấm “Cài đặt cookie” ở chân trang → “Chấp nhận tất cả” → có cookie _ga.",
            "Tag Assistant → tab Consent thấy Default = denied, Update = granted.",
          ]}
        />
      </Lesson>

      <Lesson id="bai-8">
        <p>
          Enhanced Conversions gửi email/SĐT (Google tự mã hoá SHA-256) để đối chiếu chuyển đổi chính xác hơn. Chỉ được gửi khi người
          dùng <b>tích ô đồng ý riêng</b> ở checkout <b>và</b> đã cho phép <code>ad_user_data</code>.
        </p>
        <Code>{B8_USERDATA}</Code>
        <ol>
          <li>Google Ads → Goals → Settings → bật <b>Enhanced conversions for web</b> → phương thức Google Tag Manager.</li>
          <li>
            Trong tag Ads Conversion (Bài 6): tick <b>Include user-provided data</b> → New Variable → <b>User-Provided Data</b> → Manual
            → Email = Data Layer Variable <code>user_data.email</code>, Phone = <code>user_data.phone_number</code>.
          </li>
        </ol>
        <Check
          items={[
            "Đặt hàng KHÔNG tích ô Enhanced Conversions → purchase không có user_data.",
            "Tích ô + đã chấp nhận cookie → có user_data.",
          ]}
        />
      </Lesson>

      <Lesson id="bai-9">
        <ol>
          <li>GTM → <b>Submit</b> → đặt tên version (vd. “v1 – GA4 ecommerce + Ads purchase”) → <b>Publish</b>. Chưa Publish thì tag chỉ chạy trong Preview.</li>
          <li>Điền thông tin người vận hành trong <code>lib/site-config.ts</code> (các trang chính sách báo đỏ nếu thiếu).</li>
          <li>Vercel → Settings → Environment Variables: <code>NEXT_GTM_ID</code> = ID container → Redeploy.</li>
          <li>Trên tên miền thật: Preview GTM với URL mới, kiểm tra lại cả Bài 7.</li>
          <li>
            Mỗi khi thêm tag mới, cập nhật bảng trong <Link href="/cookies" className="text-accent underline">Chính sách cookie</Link>.
          </li>
        </ol>
        <p>
          Không chạy quảng cáo Google Ads thật có lời chào bán/giá/khuyến mại trỏ về cửa hàng demo — dễ bị khoá tài khoản vì vi phạm
          chính sách Misrepresentation.
        </p>
      </Lesson>
    </article>
  );
}
