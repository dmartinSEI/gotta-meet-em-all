import { auth } from "@/auth";

export class AdminAuthError extends Error {
  constructor(message: "Unauthorized" | "Forbidden") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new AdminAuthError("Unauthorized");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(session.user.email.toLowerCase())) {
    throw new AdminAuthError("Forbidden");
  }
}
