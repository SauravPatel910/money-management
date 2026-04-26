import { NextResponse } from "next/server";
import { createTransaction, listTransactions } from "@/server/moneyRepository";
import {
  handleApiError,
  validateTransactionPayload,
} from "../_utils";
import type { TransactionInput } from "@/types/money";

export async function GET() {
  try {
    return NextResponse.json(await listTransactions());
  } catch (error) {
    return handleApiError(error, "Failed to load transactions");
  }
}

export async function POST(request: Request) {
  try {
    const transaction = validateTransactionPayload(
      await request.json(),
      "create",
    ) as TransactionInput;
    return NextResponse.json(await createTransaction(transaction), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error, "Failed to create transaction");
  }
}
