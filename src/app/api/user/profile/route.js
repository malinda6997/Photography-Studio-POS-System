import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(request) {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    console.log("Profile update - Token exists:", !!token);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token.value, JWT_SECRET);
      console.log("Profile update - Token verified for user:", decoded.id);
    } catch (tokenError) {
      console.error("Profile update - Token verification failed:", tokenError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const { name, email } = body;

    console.log("Profile update - Received data:", { name, email });

    // Validate input
    if (!name || !email) {
      console.log("Profile update - Validation failed: missing name or email");
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Profile update - Validation failed: invalid email format");
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log("Profile update - Validation passed, updating profile");

    // Connect to database and update user profile
    try {
      const dbConnect = (await import("../../../../../lib/dbConnect")).default;
      const User = (await import("../../../../../models/User")).default;

      await dbConnect();

      // Update user in database
      const updatedUser = await User.findByIdAndUpdate(
        decoded.id,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
        },
        {
          new: true, // Return updated document
          runValidators: true, // Run model validations
        }
      );

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      console.log("Profile update - Successfully updated user in database");

      return NextResponse.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (dbError) {
      console.error("Database update error:", dbError);
      return NextResponse.json(
        { error: "Failed to update profile in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

