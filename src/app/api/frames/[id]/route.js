import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Frame from "../../../../../models/Frame";
import { requireAuth } from "../../../../../lib/auth";

export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;
    const frame = await Frame.findById(id);

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    return NextResponse.json(frame);
  } catch (error) {
    console.error("Frame fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch frame" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;
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

    const updateData = {
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
    };

    const frame = await Frame.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    console.log("✅ Frame updated successfully:", {
      name: frame.name,
      stockQty: frame.stockQty,
    });

    return NextResponse.json(frame);
  } catch (error) {
    console.error("Frame update error:", error);
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
      { error: "Failed to update frame" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;
    const frame = await Frame.findByIdAndDelete(id);

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    console.log("✅ Frame deleted successfully:", frame.name);

    return NextResponse.json({
      message: "Frame deleted successfully",
      deletedFrame: frame,
    });
  } catch (error) {
    console.error("Frame deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete frame" },
      { status: 500 }
    );
  }
}
