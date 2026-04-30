import { prisma } from "@/server/prisma";
import {
  FEATURE_DEFINITIONS,
  isFeatureKey,
  type FeatureFlag,
  type FeatureKey,
} from "@/lib/featureFlags";

export class FeatureDisabledError extends Error {
  constructor(message = "Feature is disabled") {
    super(message);
    this.name = "FeatureDisabledError";
  }
}

const featureFromDb = (feature: {
  key: string;
  label: string;
  enabled: boolean;
}): FeatureFlag => ({
  key: feature.key as FeatureKey,
  label: feature.label,
  enabled: feature.enabled,
});

async function ensureFeatureFlags() {
  await Promise.all(
    FEATURE_DEFINITIONS.map((feature) =>
      prisma.featureFlag.upsert({
        where: { key: feature.key },
        update: { label: feature.label },
        create: {
          key: feature.key,
          label: feature.label,
          enabled: true,
        },
      }),
    ),
  );
}

export async function listFeatureFlags() {
  await ensureFeatureFlags();
  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });
  return flags.map(featureFromDb);
}

export async function updateFeatureFlag(key: string, enabled: boolean) {
  if (!isFeatureKey(key)) {
    throw new Error("Feature key is not supported");
  }

  await ensureFeatureFlags();
  const updated = await prisma.featureFlag.update({
    where: { key },
    data: { enabled },
  });

  return featureFromDb(updated);
}

export async function isFeatureEnabled(key: FeatureKey) {
  await ensureFeatureFlags();
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    select: { enabled: true },
  });
  return flag?.enabled ?? true;
}

export async function requireFeatureEnabled(key: FeatureKey) {
  if (!(await isFeatureEnabled(key))) {
    const feature = FEATURE_DEFINITIONS.find((definition) => definition.key === key);
    throw new FeatureDisabledError(`${feature?.label || "Feature"} is disabled`);
  }
}
