"use client";

import Link from "next/link";
import { useState } from "react";
import { accountStore, type Account } from "@/lib/lab-state";
import { useHydrated } from "@/lib/hooks";

/** Tạo tài khoản giả — đặt ngoài component vì Date.now() không thuần */
function newAccount(
  input: Pick<Account, "name" | "email" | "method" | "newsletter">,
): Account {
  const now = Date.now();
  return { ...input, user_id: `u_${now.toString(36)}`, created: now };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function RegisterPage() {
  const hydrated = useHydrated();
  const { account, loggedIn } = accountStore.useStore();
  const [name, setName] = useState("Nguyễn An");
  const [email, setEmail] = useState("an.nguyen@example.com");
  const [newsletter, setNewsletter] = useState(true);
  const [busy, setBusy] = useState(false);

  async function register(method: Account["method"]) {
    setBusy(true);
    await sleep(600); // giả lập gọi API tạo tài khoản
    const acc = newAccount({
      name,
      email: email.trim().toLowerCase(),
      method,
      newsletter,
    });
    accountStore.set({ account: acc, loggedIn: true });

    // TODO Bài 10 — push event "sign_up" khi tạo tài khoản THÀNH CÔNG
    //   Tham số chuẩn: method (= method: "email" hoặc "google")
    //   KHÔNG đưa email, tên vào dataLayer.
    window.dataLayer?.push({ event: "sign_up", method }); // "email" hoặc "google"

    if (newsletter) {
      // TODO Bài 10 — người dùng tick "Nhận email ưu đãi" → push thêm "generate_lead"
      //   lead_source: "register_form", value: 50000, currency: "VND"
      if (newsletter) {
        window.dataLayer?.push({
          event: "generate_lead",
          lead_source: "register_form",
          value: 5000,
          currency: "VND",
        });
      }
    }
    setBusy(false);
  }

  async function login() {
    if (!account) return;
    setBusy(true);
    await sleep(400);
    accountStore.set({ account, loggedIn: true });
    // TODO Bài 10 — push event "login" khi đăng nhập THÀNH CÔNG (method = account.method)
    window.dataLayer?.push({ event: "login", method: account.method });
    setBusy(false);
  }

  if (!hydrated)
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-muted">Đang tải…</div>
    );

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      {account && loggedIn ? (
        <div className="card p-6">
          <p className="text-4xl" aria-hidden>
            👋
          </p>
          <h1 className="mt-2 text-2xl font-bold">Xin chào, {account.name}</h1>
          <p className="mt-2 text-sm text-muted">
            Tài khoản demo tạo bằng{" "}
            <b>{account.method === "google" ? "Google (giả lập)" : "email"}</b>.{" "}
            <code className="font-mono">user_id</code> nội bộ:{" "}
            <span className="font-mono text-foreground">{account.user_id}</span>{" "}
            — mã này mới được gửi cho GA4, không phải email.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="btn-primary">
              Mua sắm
            </Link>
            <button
              className="btn-ghost"
              onClick={() => accountStore.set({ account, loggedIn: false })}
            >
              Đăng xuất
            </button>
            <button
              className="text-sm text-muted underline underline-offset-2"
              onClick={() =>
                accountStore.set({ account: null, loggedIn: false })
              }
            >
              Xoá tài khoản demo
            </button>
          </div>
          <p className="mt-4 text-xs text-muted">
            Đăng xuất rồi “Đăng nhập lại” để luyện event{" "}
            <code className="font-mono">login</code>.
          </p>
        </div>
      ) : account ? (
        <div className="card p-6">
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
          <p className="mt-2 text-sm text-muted">
            Tài khoản demo{" "}
            <span className="font-mono text-foreground">{account.email}</span>{" "}
            (đăng ký bằng {account.method === "google" ? "Google" : "email"}).
          </p>
          <button
            className="btn-primary mt-6 w-full py-3"
            onClick={login}
            disabled={busy}
          >
            {busy ? "Đang đăng nhập…" : "Đăng nhập lại"}
          </button>
        </div>
      ) : (
        <div className="card p-6">
          <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
          <p className="-mx-1 mt-3 rounded-lg bg-[#f6ecd6] px-3 py-2 text-sm text-[#5c4410]">
            Demo — <b>không có mật khẩu</b>, tài khoản chỉ lưu trong trình duyệt
            này. Đã điền sẵn dữ liệu mẫu, <b>đừng nhập thông tin thật</b>.
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="rg-name" className="label">
                Họ tên
              </label>
              <input
                id="rg-name"
                className="field w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="rg-email" className="label">
                Email
              </label>
              <input
                id="rg-email"
                type="email"
                className="field w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
              />
              <span>
                Nhận email ưu đãi{" "}
                <span className="text-muted">
                  (luyện event <code className="font-mono">generate_lead</code>)
                </span>
              </span>
            </label>
          </div>
          <button
            className="btn-primary mt-6 w-full py-3"
            onClick={() => register("email")}
            disabled={busy || !name || !email}
          >
            {busy ? "Đang tạo tài khoản…" : "Tạo tài khoản bằng email"}
          </button>
          <button
            className="btn-ghost mt-3 w-full py-3"
            onClick={() => register("google")}
            disabled={busy}
          >
            Tiếp tục với Google (giả lập)
          </button>
          <p className="mt-4 text-xs text-muted">
            Đang học{" "}
            <Link href="/lab/guide#bai-10" className="underline">
              Bài 10
            </Link>
            : mỗi nút tạo tài khoản là một{" "}
            <code className="font-mono">sign_up</code> với{" "}
            <code className="font-mono">method</code> khác nhau.
          </p>
        </div>
      )}
    </div>
  );
}
