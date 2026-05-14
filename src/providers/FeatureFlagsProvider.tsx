"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  DEFAULT_FEATURE_FLAGS,
  featureFlagsToRecord,
  type FeatureFlag,
  type FeatureFlagsByKey,
  type FeatureKey,
} from "@/lib/featureFlags";

type FeatureFlagsState = {
  flags: FeatureFlagsByKey;
  records: FeatureFlag[];
  loading: boolean;
  error: string | null;
  isEnabled: (key: FeatureKey) => boolean;
  refresh: () => Promise<void>;
};

const FeatureFlagsContext = createContext<FeatureFlagsState | null>(null);

let featureFlagsCache: FeatureFlag[] | null = null;
let featureFlagsRequest: Promise<FeatureFlag[]> | null = null;

type FeatureFlagsProviderState = {
  records: FeatureFlag[];
  loading: boolean;
  error: string | null;
};

type FeatureFlagsProviderAction =
  | { type: "start" }
  | { type: "success"; records: FeatureFlag[] }
  | { type: "error"; error: string }
  | { type: "reset" };

const initialFeatureFlagsState: FeatureFlagsProviderState = {
  records: [],
  loading: false,
  error: null,
};

function featureFlagsReducer(
  state: FeatureFlagsProviderState,
  action: FeatureFlagsProviderAction,
): FeatureFlagsProviderState {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { records: action.records, loading: false, error: null };
    case "error":
      return { ...state, loading: false, error: action.error };
    case "reset":
      return initialFeatureFlagsState;
    default:
      return state;
  }
}

async function loadFeatureFlags(force = false) {
  if (!force && featureFlagsCache) {
    return featureFlagsCache;
  }

  if (!force && featureFlagsRequest) {
    return featureFlagsRequest;
  }

  featureFlagsRequest = fetch("/api/features", {
    credentials: "same-origin",
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Feature flags failed with ${response.status}`);
    }

    const featureFlags = (await response.json()) as FeatureFlag[];
    featureFlagsCache = featureFlags;
    return featureFlags;
  });

  try {
    return await featureFlagsRequest;
  } finally {
    featureFlagsRequest = null;
  }
}

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [{ records, loading, error }, dispatch] = useReducer(
    featureFlagsReducer,
    initialFeatureFlagsState,
  );
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resetFlags = useCallback(() => {
    featureFlagsCache = null;
    featureFlagsRequest = null;
    dispatch({ type: "reset" });
  }, []);

  const fetchFlags = useCallback(async (force = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    dispatch({ type: "start" });

    try {
      const featureFlags = await loadFeatureFlags(force);

      if (mountedRef.current && requestIdRef.current === requestId) {
        dispatch({ type: "success", records: featureFlags });
      }
    } catch (refreshError) {
      if (mountedRef.current && requestIdRef.current === requestId) {
        dispatch({
          type: "error",
          error:
            refreshError instanceof Error
              ? refreshError.message
              : "Failed to load feature flags.",
        });
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      resetFlags();
      return;
    }

    await fetchFlags(true);
  }, [fetchFlags, resetFlags, status]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated") {
      resetFlags();
      return;
    }

    void fetchFlags();
  }, [fetchFlags, resetFlags, status]);

  const flags = useMemo(
    () =>
      records.length > 0
        ? featureFlagsToRecord(records)
        : DEFAULT_FEATURE_FLAGS,
    [records],
  );

  const value = useMemo(
    () => ({
      flags,
      records,
      loading: status === "loading" || loading,
      error,
      isEnabled: (key: FeatureKey) => flags[key],
      refresh,
    }),
    [error, flags, loading, records, refresh, status],
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlagsContext() {
  const context = useContext(FeatureFlagsContext);

  if (!context) {
    throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  }

  return context;
}
