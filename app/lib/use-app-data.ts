"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AppState, safeState, seedState, storageKey } from "./invoice-store";

export type AppStorageStatus = {
  mode: "loading" | "file" | "github" | "browser" | "error";
  persisted: boolean;
  label: string;
  at?: string;
};

type UseAppDataOptions = {
  persist?: boolean;
};

export function useAppData(options: UseAppDataOptions = {}): {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  ready: boolean;
  storageStatus: AppStorageStatus;
} {
  const persist = options.persist ?? true;
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<AppStorageStatus>({
    mode: "loading",
    persisted: false,
    label: "Loading"
  });
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const remote = await loadRemoteState();
      const local = loadBrowserState();

      if (cancelled) return;

      setState(local ?? remote.state);
      setStorageStatus(local ? browserStatus("Browser draft") : remote.storage);
      setReady(true);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !persist) return;

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(async () => {
      window.localStorage.setItem(storageKey, JSON.stringify(state));

      try {
        const response = await fetch("/api/app-state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state)
        });
        const payload = response.ok ? ((await response.json()) as { storage?: AppStorageStatus }) : undefined;
        setStorageStatus(payload?.storage ?? browserStatus("Saved in this browser"));
      } catch {
        setStorageStatus(browserStatus("Saved in this browser"));
      }
    }, 450);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [persist, ready, state]);

  return {
    state,
    setState,
    ready,
    storageStatus
  };
}

async function loadRemoteState() {
  try {
    const response = await fetch("/api/app-state", { cache: "no-store" });
    if (!response.ok) {
      return {
        state: seedState,
        storage: browserStatus("Browser fallback")
      };
    }

    const payload = (await response.json()) as { state?: unknown; storage?: AppStorageStatus };
    return {
      state: safeState(payload.state),
      storage: payload.storage ?? browserStatus("Browser fallback")
    };
  } catch {
    return {
      state: seedState,
      storage: browserStatus("Browser fallback")
    };
  }
}

function loadBrowserState() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? safeState(JSON.parse(saved)) : undefined;
  } catch {
    return undefined;
  }
}

function browserStatus(label: string): AppStorageStatus {
  return {
    mode: "browser",
    persisted: false,
    label,
    at: new Date().toISOString()
  };
}
