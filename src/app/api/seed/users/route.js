import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "../../../../../lib/dbConnect";
import User from "../../../../../models/User";

export async function POST() {
  console.log("Seed API called - POST request");
  try {
    console.log("Attempting to connect to database...");
    await dbConnect();
    console.log("Database connected successfully");

    // Check if users already exist
    const existingAdmin = await User.findOne({ username: "admin" });
    const existingStaff = await User.findOne({ username: "staff" });

    const users = [];

    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash("admin123", 12);
      users.push({
        name: "Admin User",
        username: "admin",
        email: "admin@shine.com",
        passwordHash: adminPasswordHash,
        role: "admin",
      });
    }

    if (!existingStaff) {
      const staffPasswordHash = await bcrypt.hash("staff123", 12);
      users.push({
        name: "Staff User",
        username: "staff",
        email: "staff@shine.com",
        passwordHash: staffPasswordHash,
        role: "staff",
      });
    }

    if (users.length > 0) {
      await User.insertMany(users);
      return NextResponse.json({
        success: true,
        message: `Seeded ${users.length} users successfully`,
        users: users.map((user) => ({
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        })),
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Demo users already exist in the database",
      });
    }
  } catch (error) {
    console.error("Error seeding users:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Failed to seed users",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();

    const users = await User.find({}, { passwordHash: 0 }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      users: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}
