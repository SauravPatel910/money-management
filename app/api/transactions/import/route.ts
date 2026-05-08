import { NextResponse } from "next/server";
import { importTransactions } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import {
  FeatureDisabledError,
  isFeatureEnabled,
} from "@/server/featureRepository";
import {
  handleApiError,
  validateTransactionPayload,
  ValidationError,
} from "../../_utils";
import type { TransactionInput } from "@/types/money";

export async function POST(request: Request) {
  try {
    const importEnabled =
      (await isFeatureEnabled("spreadsheetImport")) ||
      (await isFeatureEnabled("bankStatementOcr"));

    if (!importEnabled) {
      throw new FeatureDisabledError("Transaction import is disabled");
    }

    const userId = await requireUserId();
    const payload = await request.json();

    if (
      typeof payload !== "object" ||
      payload === null ||
      !Array.isArray((payload as { transactions?: unknown }).transactions)
    ) {
      throw new ValidationError("transactions must be an array");
    }

    const transactions = (payload as { transactions: unknown[] }).transactions.map(
      (transaction) =>
        validateTransactionPayload(transaction, "create") as TransactionInput,
    );

    return NextResponse.json(await importTransactions(userId, transactions), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error, "Failed to import transactions");
  }
}
