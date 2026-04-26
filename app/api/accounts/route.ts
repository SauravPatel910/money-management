import { NextResponse } from "next/server";
import { createAccount, listAccounts } from "@/server/moneyRepository";

export async function GET() {
  try {
    return NextResponse.json(await listAccounts());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const account = await request.json();
    return NextResponse.json(await createAccount(account), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create account" },
      { status: 400 },
    );
  }
}
