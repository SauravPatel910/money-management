import { NextResponse } from "next/server";
import {
  createCategory,
  listCategories,
} from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import {
  handleApiError,
  validateCategoryPayload,
} from "../_utils";
import type { TransactionCategoryInput } from "@/types/money";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await listCategories(userId));
  } catch (error) {
    return handleApiError(error, "Failed to load categories");
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const category = validateCategoryPayload(
      await request.json(),
      "create",
    ) as TransactionCategoryInput;
    return NextResponse.json(await createCategory(userId, category), {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error, "Failed to create category");
  }
}
