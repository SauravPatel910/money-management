import { NextResponse } from "next/server";
import { deleteBudget, updateBudget } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import {
  handleApiError,
  validateBudgetPayload,
} from "../../_utils";
import type { BudgetInput } from "@/types/money";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const updates = validateBudgetPayload(
      await request.json(),
      "update",
    ) as Partial<BudgetInput>;
    return NextResponse.json(await updateBudget(userId, id, updates));
  } catch (error) {
    return handleApiError(error, "Failed to update budget");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    return NextResponse.json({ id: await deleteBudget(userId, id) });
  } catch (error) {
    return handleApiError(error, "Failed to delete budget");
  }
}
