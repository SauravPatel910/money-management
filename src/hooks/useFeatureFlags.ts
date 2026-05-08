"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export function useFeatureFlags(): FeatureFlagsState {
  const [records, setRecords] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/features", {
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error(`Feature flags failed with ${response.status}`);
      }
      setRecords((await response.json()) as FeatureFlag[]);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to load feature flags.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/features", { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Feature flags failed with ${response.status}`);
        }
        return response.json() as Promise<FeatureFlag[]>;
      })
      .then((featureFlags) => {
        if (!cancelled) {
          setRecords(featureFlags);
        }
      })
      .catch((refreshError: unknown) => {
        if (!cancelled) {
          setError(
            refreshError instanceof Error
              ? refreshError.message
              : "Failed to load feature flags.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const flags = useMemo(
    () => (records.length > 0 ? featureFlagsToRecord(records) : DEFAULT_FEATURE_FLAGS),
    [records],
  );

  return {
    flags,
    records,
    loading,
    error,
    isEnabled: (key) => flags[key],
    refresh,
  };
}
