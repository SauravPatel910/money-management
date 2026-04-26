import { NextResponse } from "next/server";
import { deleteTransaction, updateTransaction } from "@/server/moneyRepository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const updates = await request.json();
    return NextResponse.json(await updateTransaction(id, updates));
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update transaction",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return NextResponse.json({ id: await deleteTransaction(id) });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to delete transaction",
      },
      { status: 400 },
    );
  }
}
