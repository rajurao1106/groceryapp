"use client";

import { useCallback, useMemo, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";

const listeners = new Map<string, Set<() => void>>();
const reportedReadFailures = new Set<string>();
const reportedParseFailures = new Set<string>();

function subscribe(key: string, listener: () => void) {
  const keyListeners = listeners.get(key) ?? new Set<() => void>();
  keyListeners.add(listener);
  listeners.set(key, keyListeners);

  function syncFromOtherTab(event: StorageEvent) {
    if (event.storageArea === window.localStorage && (event.key === key || event.key === null)) listener();
  }

  window.addEventListener("storage", syncFromOtherTab);
  return () => {
    keyListeners.delete(listener);
    if (keyListeners.size === 0) listeners.delete(key);
    window.removeEventListener("storage", syncFromOtherTab);
  };
}

function notifySubscribers(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const initialSnapshot = useMemo(() => JSON.stringify(initialValue) ?? "null", [initialValue]);
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) ?? initialSnapshot;
    } catch (error) {
      if (!reportedReadFailures.has(key)) {
        console.error(`Unable to read local demo data "${key}" from localStorage.`, error);
        reportedReadFailures.add(key);
      }
      return initialSnapshot;
    }
  }, [initialSnapshot, key]);
  const getServerSnapshot = useCallback(() => initialSnapshot, [initialSnapshot]);
  const subscribeToKey = useCallback((listener: () => void) => subscribe(key, listener), [key]);
  const snapshot = useSyncExternalStore(subscribeToKey, getSnapshot, getServerSnapshot);

  const value = useMemo(() => {
    try {
      return JSON.parse(snapshot) as T;
    } catch (error) {
      if (!reportedParseFailures.has(key)) {
        console.error(`Unable to parse local demo data "${key}" from localStorage.`, error);
        reportedParseFailures.add(key);
      }
      return initialValue;
    }
  }, [initialValue, key, snapshot]);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    let currentValue = initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) currentValue = JSON.parse(stored) as T;
    } catch (error) {
      console.error(`Unable to read local demo data "${key}" before updating it.`, error);
    }

    const nextValue = typeof action === "function"
      ? (action as (previousValue: T) => T)(currentValue)
      : action;
    try {
      window.localStorage.setItem(key, JSON.stringify(nextValue));
      notifySubscribers(key);
    } catch (error) {
      console.error(`Unable to save local demo data "${key}" to localStorage.`, error);
      throw error;
    }
  }, [initialValue, key]);

  return [value, setValue];
}
