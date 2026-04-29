import { NextResponse } from "next/server";
import { deleteAccount, updateAccount } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import { handleApiError, validateAccountPayload } from "../../_utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const updates = validateAccountPayload(await request.json(), "update");
    return NextResponse.json(await updateAccount(userId, id, updates));
  } catch (error) {
    return handleApiError(error, "Failed to update account");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    return NextResponse.json({ id: await deleteAccount(userId, id) });
  } catch (error) {
    return handleApiError(error, "Failed to delete account");
  }
}
