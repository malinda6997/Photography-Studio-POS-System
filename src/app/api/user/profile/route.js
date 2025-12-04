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
    const { name, username, email } = body;

    console.log("Profile update - Received data:", { name, username, email });

    // Validate input
    if (!name || !username) {
      console.log(
        "Profile update - Validation failed: missing name or username"
      );
      return NextResponse.json(
        { error: "Name and username are required" },
        { status: 400 }
      );
    }

    // Username validation
    if (username.length < 3) {
      console.log("Profile update - Validation failed: username too short");
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Email validation (only if provided)
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log("Profile update - Validation failed: invalid email format");
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    console.log("Profile update - Validation passed, updating profile");

    // Connect to database and update user profile
    try {
      const dbConnect = (await import("../../../../../lib/dbConnect")).default;
      const User = (await import("../../../../../models/User")).default;

      await dbConnect();

      // Check if username already exists (excluding current user)
      const existingUser = await User.findOne({
        username: username.trim().toLowerCase(),
        _id: { $ne: decoded.id },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        );
      }

      // Check if email already exists (only if provided, excluding current user)
      if (email && email.trim()) {
        const existingEmailUser = await User.findOne({
          email: email.trim().toLowerCase(),
          _id: { $ne: decoded.id },
        });
        if (existingEmailUser) {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 400 }
          );
        }
      }

      // Update user in database
      const updateData = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
      };

      if (email && email.trim()) {
        updateData.email = email.trim().toLowerCase();
      } else {
        updateData.email = null;
      }

      const updatedUser = await User.findByIdAndUpdate(decoded.id, updateData, {
        new: true, // Return updated document
        runValidators: true, // Run model validations
      });

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      console.log("Profile update - Successfully updated user in database");

      return NextResponse.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          username: updatedUser.username,
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
