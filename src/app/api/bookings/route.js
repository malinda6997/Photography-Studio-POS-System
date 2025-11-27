import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Booking from "../../../../models/Booking";
import Customer from "../../../../models/Customer";
import { requireAuth } from "../../../../lib/auth";

export async function GET(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.bookingDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    if (status && ["scheduled", "completed", "cancelled"].includes(status)) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("customer", "name mobile")
      .populate("invoiceRef", "invoiceNo subtotal")
      .sort({ bookingDate: 1, slotTime: 1 });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
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
      customerId,
      bookingDate,
      slotTime,
      advancePaid = 0,
      notes,
      invoiceRef,
    } = body;

    if (!customerId || !bookingDate || !slotTime) {
      return NextResponse.json(
        { error: "Customer ID, booking date, and time slot are required" },
        { status: 400 }
      );
    }

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400 }
      );
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      bookingDate: new Date(bookingDate),
      slotTime,
      status: "scheduled",
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Time slot is already booked" },
        { status: 400 }
      );
    }

    const booking = new Booking({
      customer: customerId,
      bookingDate: new Date(bookingDate),
      slotTime,
      advancePaid,
      notes,
      invoiceRef,
    });

    await booking.save();

    // Populate customer data for response
    await booking.populate("customer", "name mobile");
    if (booking.invoiceRef) {
      await booking.populate("invoiceRef", "invoiceNo subtotal");
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
