"use client";

import { useState } from "react";
import { STORES, directionsUrl, embedUrl } from "@/lib/stores";

/*
 * Bài 11 — KHÔNG cần viết code.
 * Hai link “Chỉ đường” và “Gọi” là thẻ <a> bình thường, có data-store-id.
 * GTM bắt bằng trigger Click - Just Links (Click URL) và đọc data-store-id
 * bằng biến Auto-Event Variable → Element Attribute.
 */
export function StoreMap() {
  const [activeId, setActiveId] = useState(STORES[0].id);
  // Bản đồ nhúng của Google đặt cookie google.com → chỉ tải khi người dùng bấm
  const [mapLoaded, setMapLoaded] = useState(false);
  const active = STORES.find((s) => s.id === activeId) ?? STORES[0];

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <ul className="space-y-4">
        {STORES.map((s) => {
          const selected = s.id === active.id;
          return (
            <li key={s.id} className={`card p-5 ${selected ? "ring-2 ring-accent" : ""}`}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setActiveId(s.id)}
                aria-pressed={selected}
              >
                <p className="font-semibold">{s.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {s.address}, {s.city}
                </p>
                <p className="mt-1 text-sm text-muted">Mở cửa {s.hours}</p>
              </button>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={directionsUrl(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  data-store-id={s.id}
                >
                  Chỉ đường
                </a>
                <a href={`tel:${s.phoneE164}`} className="btn-ghost" data-store-id={s.id}>
                  Gọi {s.phone}
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card overflow-hidden">
        {mapLoaded ? (
          <iframe
            key={active.id}
            title={`Bản đồ ${active.name}`}
            src={embedUrl(active)}
            className="block h-80 w-full border-0 md:h-full md:min-h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-80 flex-col items-center justify-center gap-3 p-6 text-center md:h-full md:min-h-96">
            <p className="font-semibold">{active.name}</p>
            <p className="max-w-sm text-sm text-muted">
              Bản đồ do Google Maps cung cấp và sẽ đặt cookie của Google trên trình duyệt của bạn.
            </p>
            <button type="button" className="btn-ghost" onClick={() => setMapLoaded(true)}>
              Tải bản đồ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
