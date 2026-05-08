import { NextResponse } from "next/server";
import { deleteTransaction, updateTransaction } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import { requireFeatureEnabled } from "@/server/featureRepository";
import {
  handleApiError,
  validateTransactionPayload,
} from "../../_utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireFeatureEnabled("transactions");
    const userId = await requireUserId();
    const { id } = await params;
    const updates = validateTransactionPayload(await request.json(), "update");
    return NextResponse.json(await updateTransaction(userId, id, updates));
  } catch (error) {
    return handleApiError(error, "Failed to update transaction");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireFeatureEnabled("transactions");
    const userId = await requireUserId();
    const { id } = await params;
    return NextResponse.json({ id: await deleteTransaction(userId, id) });
  } catch (error) {
    return handleApiError(error, "Failed to delete transaction");
  }
}
