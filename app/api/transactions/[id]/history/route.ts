import { NextResponse } from "next/server";
import { listTransactionEditHistory } from "@/server/moneyRepository";
import { handleApiError } from "../../../_utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return NextResponse.json(await listTransactionEditHistory(id));
  } catch (error) {
    return handleApiError(error, "Failed to load transaction edit history");
  }
}
