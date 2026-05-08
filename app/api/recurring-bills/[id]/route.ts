import { NextResponse } from "next/server";
import {
  deleteRecurringBill,
  updateRecurringBill,
} from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import { requireFeatureEnabled } from "@/server/featureRepository";
import {
  handleApiError,
  validateRecurringBillPayload,
} from "../../_utils";
import type { RecurringBillInput } from "@/types/money";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireFeatureEnabled("recurringBills");
    const userId = await requireUserId();
    const { id } = await context.params;
    const updates = validateRecurringBillPayload(
      await request.json(),
      "update",
    ) as Partial<RecurringBillInput>;
    return NextResponse.json(await updateRecurringBill(userId, id, updates));
  } catch (error) {
    return handleApiError(error, "Failed to update recurring bill");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireFeatureEnabled("recurringBills");
    const userId = await requireUserId();
    const { id } = await context.params;
    return NextResponse.json({ id: await deleteRecurringBill(userId, id) });
  } catch (error) {
    return handleApiError(error, "Failed to delete recurring bill");
  }
}
