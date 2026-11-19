"use client";

import { useSyncExternalStore } from "react";

/**
 * Store nhỏ dựa trên localStorage, dùng với useSyncExternalStore.
 * Server render luôn dùng `initial`, client sẽ đồng bộ ngay sau hydrate.
 */
export function createLocalStore<T>(key: string, initial: T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  function read(): T {
    if (cache !== undefined) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? { ...initial, ...JSON.parse(raw) } : initial;
    } catch {
      cache = initial;
    }
    return cache as T;
  }

  function get(): T {
    if (typeof window === "undefined") return initial;
    return read();
  }

  function set(next: T | ((prev: T) => T)) {
    const value = typeof next === "function" ? (next as (p: T) => T)(get()) : next;
    cache = value;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode — bỏ qua */
    }
    listeners.forEach((l) => l());
  }

  function subscribe(cb: () => void) {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = undefined;
        cb();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  return { get, set, subscribe, useStore };
}
