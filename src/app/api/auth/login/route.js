import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "../../../../../lib/dbConnect";
import User from "../../../../../models/User";

export async function POST(request) {
  try {
    await dbConnect();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" }
    );

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email || null,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
