import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Frame from "../../../../../models/Frame";
import { requireAuth, requireAdmin } from "../../../../../lib/auth";

export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = params;
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
    const { id } = params;
    const body = await request.json();
    const {
      name,
      category,
      unitPrice,
      quantity,
      description,
      lowStockThreshold,
    } = body;

    const frame = await Frame.findByIdAndUpdate(
      id,
      { name, category, unitPrice, quantity, description, lowStockThreshold },
      { new: true, runValidators: true }
    );

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    return NextResponse.json(frame);
  } catch (error) {
    console.error("Frame update error:", error);
    return NextResponse.json(
      { error: "Failed to update frame" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = params;
    const frame = await Frame.findByIdAndDelete(id);

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Frame deleted successfully" });
  } catch (error) {
    console.error("Frame deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete frame" },
      { status: 500 }
    );
  }
}
