import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request) {
  try {
    // Get the token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get("token");

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
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("profilePicture");

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if file is actually a File object
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Invalid file format" },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profiles"
    );

    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch (dirError) {
      console.error("Error creating directory:", dirError);
      return NextResponse.json(
        { error: "Failed to create upload directory" },
        { status: 500 }
      );
    }

    // Generate unique filename with better sanitization
    const fileExtension = path.extname(file.name).toLowerCase();
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "File type not supported. Use JPG, PNG, GIF, or WebP" },
        { status: 400 }
      );
    }

    const fileName = `${decoded.userId}_${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    try {
      // Save the file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(filePath, buffer);
    } catch (fileError) {
      console.error("Error saving file:", fileError);
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 }
      );
    }

    // Create the URL path for the uploaded image
    const imageUrl = `/uploads/profiles/${fileName}`;

    // Here you would typically update the user's profile picture in your database
    // For now, we'll return the image URL

    return NextResponse.json({
      message: "Profile picture uploaded successfully",
      profilePicture: imageUrl,
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: `Failed to upload profile picture: ${error.message}` },
      { status: 500 }
    );
  }
}
