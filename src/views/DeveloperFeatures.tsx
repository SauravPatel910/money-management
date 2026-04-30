"use client";

import { useState } from "react";
import PageLayout from "../components/UI/PageLayout";
import Loading from "../components/UI/Loading";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import type { FeatureFlag } from "../lib/featureFlags";

export default function DeveloperFeatures() {
  const { records, loading, error, refresh } = useFeatureFlags();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const toggleFeature = async (feature: FeatureFlag) => {
    setPendingKey(feature.key);
    setMessage(null);

    try {
      const response = await fetch(`/api/developer/features/${feature.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ enabled: !feature.enabled }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Feature update failed.");
      }

      await refresh();
      setMessage(`${feature.label} ${feature.enabled ? "disabled" : "enabled"}.`);
    } catch (toggleError) {
      setMessage(
        toggleError instanceof Error
          ? toggleError.message
          : "Feature update failed.",
      );
    } finally {
      setPendingKey(null);
    }
  };

  if (loading && records.length === 0) {
    return <Loading text="Loading feature controls..." />;
  }

  return (
    <PageLayout title="Feature Controls" showBalanceCard={false}>
      <section className="rounded-2xl border border-primary-100 bg-white/90 p-6 shadow-card">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-primary-800">
            Global feature toggles
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Changes apply to every user. Only developer accounts can update these
            switches.
          </p>
        </div>

        {(error || message) && (
          <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
            {message || error}
          </div>
        )}

        <div className="divide-y divide-primary-100">
          {records.map((feature) => (
            <div
              key={feature.key}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold text-primary-800">{feature.label}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                  {feature.key}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={feature.enabled}
                disabled={pendingKey === feature.key}
                onClick={() => toggleFeature(feature)}
                className={`relative h-8 w-16 rounded-full transition-colors ${
                  feature.enabled ? "bg-income" : "bg-gray-300"
                } disabled:cursor-wait disabled:opacity-70`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    feature.enabled ? "translate-x-9" : "translate-x-1"
                  }`}
                />
                <span className="sr-only">
                  {feature.enabled ? "Disable" : "Enable"} {feature.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
