import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(request) {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the token
    try {
      jwt.verify(token.value, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // In a real application, you would:
    // 1. Fetch the user's current hashed password from the database
    // 2. Compare the current password with the stored hash
    // 3. If valid, hash the new password and update it in the database

    // For demonstration, we'll simulate password validation
    // In real implementation, replace this with actual database operations

    // Simulate current password validation (replace with actual DB check)
    const isCurrentPasswordValid = true; // This should be: await bcrypt.compare(currentPassword, user.hashedPassword)

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    await bcrypt.hash(newPassword, saltRounds);

    // Here you would update the password in your database
    // await updateUserPassword(decoded.userId, hashedNewPassword);

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
