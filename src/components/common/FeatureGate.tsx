"use client";

import type { ReactNode } from "react";
import type { FeatureKey } from "@/lib/featureFlags";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

type FeatureGateProps = {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
};

export default function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const { isEnabled, loading } = useFeatureFlags();

  if (loading) {
    return null;
  }

  return isEnabled(feature) ? <>{children}</> : <>{fallback}</>;
}
