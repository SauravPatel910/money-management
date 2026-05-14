"use client";

import { useFeatureFlagsContext } from "@/providers/FeatureFlagsProvider";
import type {
  FeatureFlag,
  FeatureFlagsByKey,
  FeatureKey,
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
  return useFeatureFlagsContext();
}
