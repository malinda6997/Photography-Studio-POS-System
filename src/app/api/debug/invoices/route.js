import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Invoice from "../../../../../models/Invoice";

export async function GET() {
  await dbConnect();

  try {
    const count = await Invoice.countDocuments();
    const invoices = await Invoice.find({})
      .limit(5)
      .populate("customer", "name");

    return NextResponse.json({
      totalInvoices: count,
      sampleInvoices: invoices,
      message: `Found ${count} invoices in database`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        totalInvoices: 0,
        sampleInvoices: [],
      },
      { status: 500 }
    );
  }
}

