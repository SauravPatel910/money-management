import { auth } from "../../auth";
import { prisma } from "./prisma";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
}

const getDeveloperEmails = () =>
  (process.env.DEVELOPER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export async function requireDeveloper() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new UnauthorizedError();
  }

  const email =
    session.user.email ||
    (
      await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
    )?.email;

  if (!email || !getDeveloperEmails().includes(email.toLowerCase())) {
    throw new UnauthorizedError("Developer access required");
  }

  return userId;
}
