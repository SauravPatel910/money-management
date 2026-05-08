import { NextResponse } from "next/server";
import { createBudget, listBudgets } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import { requireFeatureEnabled } from "@/server/featureRepository";
import {
  handleApiError,
  validateBudgetPayload,
} from "../_utils";
import type { BudgetInput } from "@/types/money";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await listBudgets(userId));
  } catch (error) {
    return handleApiError(error, "Failed to load budgets");
  }
}

export async function POST(request: Request) {
  try {
    await requireFeatureEnabled("budgets");
    const userId = await requireUserId();
    const budget = validateBudgetPayload(
      await request.json(),
      "create",
    ) as BudgetInput;
    return NextResponse.json(await createBudget(userId, budget), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error, "Failed to create budget");
  }
}
