import { NextResponse } from "next/server";
import { requireUserId } from "@/server/authSession";
import { getMoneyDataSnapshot } from "@/server/moneyRepository";
import { handleApiError } from "../_utils";

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await getMoneyDataSnapshot(userId));
  } catch (error) {
    return handleApiError(error, "Failed to load money data");
  }
}
