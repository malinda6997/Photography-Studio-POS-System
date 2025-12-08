import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Booking from "../../../../../models/Booking";
import { requireAuth } from "../../../../../lib/auth";

export async function PUT(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;
    const body = await request.json();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update booking fields
    if (body.status) booking.status = body.status;
    if (body.bookingDate) booking.bookingDate = new Date(body.bookingDate);
    if (body.slotTime) booking.slotTime = body.slotTime;
    if (body.notes !== undefined) booking.notes = body.notes;
    if (body.advancePaid !== undefined) booking.advancePaid = body.advancePaid;
    if (body.invoiceRef !== undefined) booking.invoiceRef = body.invoiceRef;

    await booking.save();

    // Populate customer data for response
    await booking.populate("customer", "name mobile");
    if (booking.invoiceRef) {
      await booking.populate("invoiceRef", "invoiceNo subtotal");
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
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

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await Booking.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Booking deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Booking deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;

    const booking = await Booking.findById(id)
      .populate("customer", "name mobile email")
      .populate("invoiceRef", "invoiceNo subtotal");

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}
