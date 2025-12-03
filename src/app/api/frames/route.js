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
      category,
      unitPrice,
      quantity,
      description,
      lowStockThreshold,
    } = body;

    if (!name || !category || unitPrice == null || quantity == null) {
      return NextResponse.json(
        { error: "Name, category, unit price, and quantity are required" },
        { status: 400 }
      );
    }

    const frame = new Frame({
      name,
      category,
      unitPrice,
      quantity,
      description,
      lowStockThreshold,
    });
    await frame.save();

    return NextResponse.json(frame, { status: 201 });
  } catch (error) {
    console.error("Frame creation error:", error);
    return NextResponse.json(
      { error: "Failed to create frame" },
      { status: 500 }
    );
  }
}

