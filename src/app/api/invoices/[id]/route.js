import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Invoice from "../../../../../models/Invoice";
import { requireAuth } from "../../../../../lib/auth";

export async function GET(request, { params }) {
  // Await params in Next.js 16
  const { id } = await params;
  console.log(`🔍 GET /api/invoices/${id} - Request received`);

  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();
  console.log("📊 Database connected for invoice detail");

  try {
    console.log(`🆔 Looking for invoice with ID: ${id}`);
    const invoice = await Invoice.findById(id)
      .populate("customer", "name mobile email notes")
      .populate("createdBy", "name")
      .populate("items.refId", "name category");

    if (!invoice) {
      console.log(`❌ Invoice not found for ID: ${id}`);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    console.log(`✅ Invoice found: ${invoice.invoiceNo}`);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  // Await params in Next.js 16
  const { id } = await params;
  console.log(`💰 PUT /api/invoices/${id} - Payment update request`);

  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();
  console.log("📊 Database connected for invoice update");

  try {
    const { paymentAmount, notes } = await request.json();

    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update payment information
    const newTotalPaid = invoice.totalPaid + paymentAmount;
    const newStatus = newTotalPaid >= invoice.subtotal ? "paid" : "partial";

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        $inc: { totalPaid: paymentAmount },
        paymentStatus: newStatus,
        notes: notes || invoice.notes,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate("customer", "name mobile email address")
      .populate("createdBy", "name")
      .populate("items.refId", "name category");

    console.log(
      `✅ Payment recorded: $${paymentAmount} for invoice ${invoice.invoiceNo}`
    );
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Payment update error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
