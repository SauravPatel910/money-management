import { NextResponse } from "next/server";
import { createTransaction, listTransactions } from "@/server/moneyRepository";

export async function GET() {
  try {
    return NextResponse.json(await listTransactions());
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to load transactions",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const transaction = await request.json();
    return NextResponse.json(await createTransaction(transaction), {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to create transaction",
      },
      { status: 400 },
    );
  }
}
