import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "./dbConnect";
import User from "../models/User";

export async function verifyToken(request) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return { error: "No token provided", status: 401 };
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Connect to database and get user details
    await dbConnect();
    const user = await User.findById(payload.userId).select("-password");

    if (!user) {
      return { error: "User not found", status: 401 };
    }

    return { user, status: 200 };
  } catch (error) {
    console.error("Token verification error:", error);
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
