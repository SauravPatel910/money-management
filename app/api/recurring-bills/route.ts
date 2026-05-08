import { NextResponse } from "next/server";
import {
  createRecurringBill,
  listRecurringBills,
} from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import { requireFeatureEnabled } from "@/server/featureRepository";
import {
  handleApiError,
  validateRecurringBillPayload,
} from "../_utils";
import type { RecurringBillInput } from "@/types/money";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await listRecurringBills(userId));
  } catch (error) {
    return handleApiError(error, "Failed to load recurring bills");
  }
}

export async function POST(request: Request) {
  try {
    await requireFeatureEnabled("recurringBills");
    const userId = await requireUserId();
    const bill = validateRecurringBillPayload(
      await request.json(),
      "create",
    ) as RecurringBillInput;
    return NextResponse.json(await createRecurringBill(userId, bill), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error, "Failed to create recurring bill");
  }
}
