import { NextResponse } from "next/server";
import { createAccount, listAccounts } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import {
  handleApiError,
  validateAccountPayload,
} from "../_utils";
import type { AccountInput } from "@/types/money";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await listAccounts(userId));
  } catch (error) {
    return handleApiError(error, "Failed to load accounts");
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const account = validateAccountPayload(
      await request.json(),
      "create",
    ) as AccountInput;
    return NextResponse.json(await createAccount(userId, account), { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create account");
  }
}
