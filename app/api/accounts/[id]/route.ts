import { NextResponse } from "next/server";
import { deleteAccount, updateAccount } from "@/server/moneyRepository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const updates = await request.json();
    return NextResponse.json(await updateAccount(id, updates));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update account" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return NextResponse.json({ id: await deleteAccount(id) });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 400 },
    );
  }
}
