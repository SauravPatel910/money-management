import { NextResponse } from "next/server";
import { payRecurringBill } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import { requireFeatureEnabled } from "@/server/featureRepository";
import { handleApiError } from "../../../_utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireFeatureEnabled("recurringBills");
    const userId = await requireUserId();
    const { id } = await context.params;
    return NextResponse.json(await payRecurringBill(userId, id), { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to pay recurring bill");
  }
}
