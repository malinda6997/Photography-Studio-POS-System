import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

/**
 * Verify JWT token and return user data
 * @param {Request} request - The incoming request
 * @returns {Object|NextResponse} - User object or error response
 */
export async function requireAuth(request) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token is required" },
        { status: 401 }
      );
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    return user;
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

/**
 * Extract user from token without throwing errors
 * @param {Request} request - The incoming request
 * @returns {Object|null} - User object or null
 */
export function getUser(request) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return null;

    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}
