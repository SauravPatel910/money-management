import { NextResponse } from "next/server";
import { listTransactionEditHistory } from "@/server/moneyRepository";
import { requireUserId } from "@/server/authSession";
import { handleApiError } from "../../../_utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    return NextResponse.json(await listTransactionEditHistory(userId, id));
  } catch (error) {
    return handleApiError(error, "Failed to load transaction edit history");
  }
}
