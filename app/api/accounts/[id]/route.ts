import { NextResponse } from "next/server";
import { deleteAccount, updateAccount } from "@/server/moneyRepository";
import { handleApiError, validateAccountPayload } from "../../_utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const updates = validateAccountPayload(await request.json(), "update");
    return NextResponse.json(await updateAccount(id, updates));
  } catch (error) {
    return handleApiError(error, "Failed to update account");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return NextResponse.json({ id: await deleteAccount(id) });
  } catch (error) {
    return handleApiError(error, "Failed to delete account");
  }
}
