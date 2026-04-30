import { NextResponse } from "next/server";
import { createTransaction, listTransactions } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import { requireFeatureEnabled } from "@/server/featureRepository";
import {
  handleApiError,
  validateTransactionPayload,
} from "../_utils";
import type { TransactionInput } from "@/types/money";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await listTransactions(userId));
  } catch (error) {
    return handleApiError(error, "Failed to load transactions");
  }
}

export async function POST(request: Request) {
  try {
    await requireFeatureEnabled("transactions");
    const userId = await requireUserId();
    const transaction = validateTransactionPayload(
      await request.json(),
      "create",
    ) as TransactionInput;
    return NextResponse.json(await createTransaction(userId, transaction), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error, "Failed to create transaction");
  }
}
