import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    const token = request.cookies.get("auth-token");

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = jwt.verify(
      token.value,
      process.env.JWT_SECRET || "fallback-secret"
    );

    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}
