import { NextResponse } from "next/server";
import { listFeatureFlags } from "@/server/featureRepository";
import { requireUserId } from "@/server/authSession";
import { handleApiError } from "../_utils";

export async function GET() {
  try {
    await requireUserId();
    return NextResponse.json(await listFeatureFlags());
  } catch (error) {
    return handleApiError(error, "Failed to load feature flags");
  }
}
