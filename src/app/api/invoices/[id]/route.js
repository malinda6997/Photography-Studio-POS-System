import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Invoice from "../../../../../models/Invoice";
import { requireAuth } from "../../../../../lib/auth";

export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = params;
    const invoice = await Invoice.findById(id)
      .populate("customer", "name mobile email notes")
      .populate("createdBy", "name")
      .populate("items.refId", "name category");

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
