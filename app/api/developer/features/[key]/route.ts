import { NextResponse } from "next/server";
import { updateFeatureFlag } from "@/server/featureRepository";
import { requireDeveloper } from "@/server/authSession";
import { handleApiError, ValidationError } from "../../../_utils";

type RouteContext = {
  params: Promise<{ key: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireDeveloper();
    const { key } = await context.params;
    const payload = await request.json();

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof (payload as { enabled?: unknown }).enabled !== "boolean"
    ) {
      throw new ValidationError("enabled must be a boolean");
    }

    return NextResponse.json(
      await updateFeatureFlag(key, (payload as { enabled: boolean }).enabled),
    );
  } catch (error) {
    return handleApiError(error, "Failed to update feature flag");
  }
}
