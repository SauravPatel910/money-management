import { NextResponse } from "next/server";
import {
  deleteCategory,
  updateCategory,
} from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import {
  handleApiError,
  validateCategoryPayload,
} from "../../_utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const updates = validateCategoryPayload(await request.json(), "update");
    return NextResponse.json(await updateCategory(userId, id, updates));
  } catch (error) {
    return handleApiError(error, "Failed to update category");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    return NextResponse.json({ id: await deleteCategory(userId, id) });
  } catch (error) {
    return handleApiError(error, "Failed to delete category");
  }
}
