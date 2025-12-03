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

    // Fetch fresh user data from database to get latest updates
    try {
      const dbConnect = (await import("../../../../lib/dbConnect")).default;
      const User = (await import("../../../../models/User")).default;

      await dbConnect();

      const user = await User.findById(decoded.id).select("-passwordHash");

      if (!user) {
        return NextResponse.json({ user: null });
      }

      return NextResponse.json({
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (dbError) {
      console.error("Database error in session:", dbError);
      // Fallback to token data if database fails
      return NextResponse.json({
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        },
      });
    }
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}

