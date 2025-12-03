import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";

// Get current user from token
async function getCurrentUser(request) {
  const token = request.cookies.get("auth-token");
  if (!token) return null;

  try {
    return jwt.verify(token.value, process.env.JWT_SECRET || "fallback-secret");
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// GET - List all users (Admin only)
export async function GET(request) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const users = await User.find({}, { passwordHash: 0 }).sort({
      createdAt: -1,
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create new user (Admin only)
export async function POST(request) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (!["admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be admin or staff" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({ name, email, passwordHash, role });
    await user.save();

    // Return user without password
    const userObject = user.toObject();
    delete userObject.passwordHash;
    return NextResponse.json(userObject, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

