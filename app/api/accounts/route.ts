import { NextResponse } from "next/server";
import { createAccount, listAccounts } from "@/server/moneyRepository";
import {
  handleApiError,
  validateAccountPayload,
} from "../_utils";
import type { AccountInput } from "@/types/money";

export async function GET() {
  try {
    return NextResponse.json(await listAccounts());
  } catch (error) {
    return handleApiError(error, "Failed to load accounts");
  }
}

export async function POST(request: Request) {
  try {
    const account = validateAccountPayload(
      await request.json(),
      "create",
    ) as AccountInput;
    return NextResponse.json(await createAccount(account), { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create account");
  }
}
