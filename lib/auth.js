import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "./dbConnect";
import User from "../models/User";

export async function verifyToken(request) {
  try {
    console.log("🔐 Starting token verification...");
    const token = request.cookies.get("auth-token")?.value;
    console.log("🍪 Token found:", token ? "YES" : "NO");

    if (!token) {
      console.log("❌ No token provided");
      return { error: "No token provided", status: 401 };
    }

    console.log("🔑 JWT_SECRET exists:", !!process.env.JWT_SECRET);
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    console.log("✅ JWT verified, payload:", payload);

    // Connect to database and get user details
    await dbConnect();
    console.log("📊 Database connected, searching for user ID:", payload.id);
    const user = await User.findById(payload.id).select("-passwordHash");
    console.log("👤 User found:", user ? "YES" : "NO");

    if (!user) {
      console.log("❌ User not found in database");
      return { error: "User not found", status: 401 };
    }

    console.log("✅ Authentication successful for user:", user.email);
    return { user, status: 200 };
  } catch (error) {
    console.error("❌ Token verification error:", error.message);
    console.error("Full error:", error);
    return { error: "Invalid token", status: 401 };
  }
}

export async function requireAuth(request) {
  const result = await verifyToken(request);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return result.user;
}

export async function requireAdmin(request) {
  const user = await requireAuth(request);

  if (user instanceof NextResponse) {
    return user; // Return error response
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  return user;
}
