import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { handleApiError, jsonError } from "../../_utils";

const signupSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const parsed = signupSchema.safeParse(await request.json());

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return jsonError(firstIssue?.message ?? "Invalid signup details", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (existingUser) {
      return jsonError("An account with this email already exists", 400);
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name || null,
        email: parsed.data.email,
        passwordHash: await hash(parsed.data.password, 12),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create account");
  }
}
