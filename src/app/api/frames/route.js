import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Frame from "../../../../models/Frame";
import { requireAuth } from "../../../../lib/auth";

export async function GET(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock");

    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (lowStock === "true") {
      query = {
        ...query,
        $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
      };
    }

    const frames = await Frame.find(query).sort({ name: 1 });
    return NextResponse.json(frames);
  } catch (error) {
    console.error("Frames fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch frames" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const body = await request.json();
    const {
      name,
      type,
      dimensions,
      unitPrice,
      stockQty,
      minStockLevel,
      material,
      color,
      description,
      isActive,
    } = body;

    if (
      !name ||
      !type ||
      !dimensions ||
      unitPrice == null ||
      stockQty == null
    ) {
      return NextResponse.json(
        {
          error:
            "Name, type, dimensions, unit price, and stock quantity are required",
        },
        { status: 400 }
      );
    }

    const frame = new Frame({
      name,
      type,
      dimensions,
      unitPrice,
      stockQty,
      minStockLevel: minStockLevel || 5,
      material,
      color,
      description,
      isActive: isActive !== undefined ? isActive : true,
    });
    await frame.save();

    console.log("✅ Frame created successfully:", {
      name: frame.name,
      type: frame.type,
      stockQty: frame.stockQty,
    });

    return NextResponse.json(frame, { status: 201 });
  } catch (error) {
    console.error("Frame creation error:", error);
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create frame" },
      { status: 500 }
    );
  }
}
