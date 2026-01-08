import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Protect API routes by checking authentication
 * Usage in API routes:
 *
 * const session = await requireAuth();
 * if (session instanceof NextResponse) {
 *   return session; // Returns 401 error
 * }
 * // Continue with authenticated request
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  return session;
}

/**
 * Check if user has specific role
 */
export async function requireRole(role: "admin" | "manager" | "user") {
  const session = await requireAuth();

  if (session instanceof NextResponse) {
    return session;
  }

  const userRole = (session.user as any).role;

  if (userRole !== role && userRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Insufficient permissions." },
      { status: 403 }
    );
  }

  return session;
}
