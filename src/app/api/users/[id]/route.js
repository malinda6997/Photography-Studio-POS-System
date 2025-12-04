import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "../../../../../lib/dbConnect";
import User from "../../../../../models/User";

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

// GET - Get specific user (Admin only)
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const user = await User.findById(params.id, { passwordHash: 0 });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT - Update user (Admin only)
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { name, username, email, role } = await request.json();

    if (!name || !username) {
      return NextResponse.json(
        { error: "Name and username are required" },
        { status: 400 }
      );
    }

    if (role && !["admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be admin or staff" },
        { status: 400 }
      );
    }

    // Check if username already exists (excluding current user)
    const existingUser = await User.findOne({
      username,
      _id: { $ne: params.id },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Check if email already exists (only if provided, excluding current user)
    if (email) {
      const existingEmailUser = await User.findOne({
        email,
        _id: { $ne: params.id },
      });
      if (existingEmailUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    const updateData = { name, username, email: email || null };
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(params.id, updateData, {
      new: true,
      select: { passwordHash: 0 },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    if (error.code === 11000) {
      // Determine which field caused the duplicate error
      const field = error.keyPattern?.username ? "Username" : "Email";
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (Admin only, cannot delete self)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (currentUser.id === params.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndDelete(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
