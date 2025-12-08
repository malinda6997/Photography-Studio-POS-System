import { NextResponse } from "next/server";
import { requireAuth } from "../../../lib/auth";
import {
  getNextSequence,
  generateInvoiceNumber,
  generateReceiptNumber,
} from "../../../../../lib/server-utils";

export async function POST(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name || !["invoice", "receipt"].includes(name)) {
      return NextResponse.json(
        { error: "Valid counter name (invoice or receipt) is required" },
        { status: 400 }
      );
    }

    const sequence = await getNextSequence(name);

    let generatedNumber;
    if (name === "invoice") {
      generatedNumber = generateInvoiceNumber(sequence);
    } else {
      generatedNumber = generateReceiptNumber(sequence);
    }

    return NextResponse.json({
      sequence,
      number: generatedNumber,
    });
  } catch (error) {
    console.error("Counter increment error:", error);
    return NextResponse.json(
      { error: "Failed to increment counter" },
      { status: 500 }
    );
  }
}
