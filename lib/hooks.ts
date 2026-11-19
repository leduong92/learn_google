"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** false trong lượt render hydrate (dữ liệu localStorage chưa có), true sau đó. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Chạy fn đúng 1 lần cho mỗi `key` trong vòng đời component.
 * Chặn việc React StrictMode (dev) gọi effect 2 lần → bắn trùng event.
 * key = null → chưa sẵn sàng, chưa chạy.
 */
export function useTrackOnce(key: string | null, fn: () => void) {
  const fired = useRef<string | null>(null);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    if (key === null || fired.current === key) return;
    fired.current = key;
    fnRef.current();
  }, [key]);
}
