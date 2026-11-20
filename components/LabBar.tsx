"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GtmStatus = { id: string; loaded: boolean };

/** Tự phát hiện GTM: khi container load xong, GTM tạo window.google_tag_manager["GTM-XXXX"] */
function readStatus(): GtmStatus {
  const id = Object.keys(window.google_tag_manager ?? {}).find((k) => k.startsWith("GTM-")) ?? "";
  return { id, loaded: !!id };
}

export function LabBar() {
  const [status, setStatus] = useState<GtmStatus | null>(null);

  useEffect(() => {
    let n = 0;
    const timer = window.setInterval(() => {
      const s = readStatus();
      setStatus(s);
      if (s.loaded || ++n > 20) window.clearInterval(timer);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="bg-lab text-lab-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-xs">
        <span className="font-mono font-semibold tracking-wide text-[#9fd3a7]">GTM / ADS LAB</span>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/lab/guide" className="hover:text-white">📘 Bài học</Link>
          <Link href="/lab/glossary" className="hover:text-white">📖 Từ điển</Link>
          <Link href="/lab/ads" className="hover:text-white">Mô phỏng click Ads</Link>
        </nav>
        <span className="ml-auto font-mono">
          {status === null ? (
            "GTM: …"
          ) : status.loaded ? (
            <span className="text-[#9fd3a7]">GTM: {status.id} ● đã load</span>
          ) : (
            <Link href="/lab/guide#bai-1" className="text-[#f5c26b] hover:underline">
              GTM: chưa nhúng → làm Bài 1
            </Link>
          )}
        </span>
      </div>
    </div>
  );
}
