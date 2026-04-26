import { NextResponse } from "next/server";
import { deleteTransaction, updateTransaction } from "@/server/moneyRepository";
import {
  handleApiError,
  validateTransactionPayload,
} from "../../_utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const updates = validateTransactionPayload(await request.json(), "update");
    return NextResponse.json(await updateTransaction(id, updates));
  } catch (error) {
    return handleApiError(error, "Failed to update transaction");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return NextResponse.json({ id: await deleteTransaction(id) });
  } catch (error) {
    return handleApiError(error, "Failed to delete transaction");
  }
}
