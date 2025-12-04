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
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email || null,
        },
      });
    } catch (dbError) {
      console.error("Database error in session:", dbError);
      // Fallback to token data if database fails
      return NextResponse.json({
        user: {
          id: decoded.id,
          username: decoded.username,
          name: decoded.name,
          role: decoded.role,
          email: decoded.email || null,
        },
      });
    }
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}
