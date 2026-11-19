"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GtmStatus = { id: string; loaded: boolean };

function readStatus(): GtmStatus {
  const id = window.__labGtmId || "";
  return { id, loaded: !!(id && window.google_tag_manager?.[id]) };
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
          <Link href="/lab/ads" className="hover:text-white">① Mô phỏng click Ads</Link>
          <Link href="/lab/funnel" className="hover:text-white">② Phễu &amp; ROAS</Link>
          <Link href="/lab/guide" className="hover:text-white">③ Hướng dẫn GTM</Link>
          <Link href="/lab/settings" className="hover:text-white">⚙ Cài đặt</Link>
        </nav>
        <span className="ml-auto font-mono">
          {status === null ? (
            "GTM: …"
          ) : !status.id ? (
            <Link href="/lab/settings" className="text-[#f5c26b] hover:underline">
              GTM: chưa cấu hình ID
            </Link>
          ) : status.loaded ? (
            <span className="text-[#9fd3a7]">GTM: {status.id} ● đã load</span>
          ) : (
            <span className="text-[#f5c26b]">GTM: {status.id} ○ chưa load (adblock / sai ID?)</span>
          )}
        </span>
      </div>
    </div>
  );
}
