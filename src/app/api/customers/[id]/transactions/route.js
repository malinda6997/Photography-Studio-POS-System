import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import Invoice from "../../../../../../models/Invoice";
import { requireAuth } from "../../../../../../lib/auth";

export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  // Only admin can view customer transactions
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  await dbConnect();

  try {
    const { id } = await params;

    // Fetch all invoices for this customer
    const invoices = await Invoice.find({ customerId: id })
      .sort({ createdAt: -1 })
      .select(
        "invoiceNumber createdAt items total status paymentMethod discount"
      );

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Customer transactions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer transactions" },
      { status: 500 }
    );
  }
}
