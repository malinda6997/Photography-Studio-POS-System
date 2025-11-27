import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Invoice from "../../../../../models/Invoice";
import { requireAuth } from "../../../../../lib/auth";

export async function GET(request, { params }) {
  console.log(`🔍 GET /api/invoices/${params.id} - Request received`);
  
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();
  console.log("📊 Database connected for invoice detail");

  try {
    const { id } = params;
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
