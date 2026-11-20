"use client";

import { useState } from "react";
import type { GlossarySection } from "@/lib/glossary";

/** Bỏ dấu tiếng Việt để tìm "bien" vẫn ra "biến" */
function fold(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

/** Phần giữa hai dấu ` hiển thị dạng code */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) => (i % 2 === 1 ? <code key={i}>{part}</code> : <span key={i}>{part}</span>))}
    </>
  );
}

export function Glossary({ sections }: { sections: GlossarySection[] }) {
  const [q, setQ] = useState("");
  const needle = fold(q.trim());

  const filtered = sections
    .map((s) => ({
      ...s,
      entries: needle
        ? s.entries.filter((e) => fold([e.t, e.w, e.d, e.ex].filter(Boolean).join(" ")).includes(needle))
        : s.entries,
    }))
    .filter((s) => s.entries.length > 0);
  const total = filtered.reduce((n, s) => n + s.entries.length, 0);

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-3 backdrop-blur">
        <label htmlFor="glossary-q" className="label">
          Tìm thuật ngữ, menu hoặc trường (gõ không dấu cũng được)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="glossary-q"
            type="search"
            className="field w-full"
            placeholder="vd. trigger, Hits Sent, ROAS, item_variant…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {needle && <span className="shrink-0 text-sm text-muted">{total} kết quả</span>}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-muted">
          Không có mục nào chứa “{q}”. Thử từ khoá ngắn hơn hoặc tên tiếng Anh trên giao diện.
        </p>
      )}

      {filtered.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-24">
          <h2>{s.title}</h2>
          {s.intro && (
            <p className="text-muted">
              <Rich text={s.intro} />
            </p>
          )}
          <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-card">
            {s.entries.map((e) => (
              <div key={`${e.t}|${e.w ?? ""}`} className="grid gap-1 px-4 py-3 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-4">
                <div>
                  <p className="font-semibold">
                    <Rich text={e.t} />
                  </p>
                  {e.w && (
                    <p className="text-xs! leading-5! text-muted">
                      <Rich text={e.w} />
                    </p>
                  )}
                </div>
                <div>
                  <p>
                    <Rich text={e.d} />
                  </p>
                  {e.ex && (
                    <p className="text-sm! text-muted">
                      <span className="font-medium text-accent">Ví dụ: </span>
                      <Rich text={e.ex} />
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
