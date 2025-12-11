import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../../lib/dbConnect";
import Payment from "../../../../models/Payment";
import Invoice from "../../../../models/Invoice";
import {
  getNextSequence,
  generateReceiptNumber,
  calculatePaymentStatus,
} from "../../../../lib/server-utils";
import { requireAuth } from "../../../lib/auth";

export async function GET(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    let query = {};

    if (invoiceId) {
      query.invoice = invoiceId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .populate("invoice", "invoiceNo subtotal")
      .populate("receivedBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  const session_db = await mongoose.startSession();

  try {
    const body = await request.json();
    let createdPayment;

    await session_db.withTransaction(async () => {
      const { invoiceId, amount, method, paymentType, note } = body;

      if (!invoiceId || !amount || amount <= 0 || !method || !paymentType) {
        throw new Error(
          "Invoice ID, amount, method, and payment type are required"
        );
      }

      // Validate invoice exists
      const invoice = await Invoice.findById(invoiceId).session(session_db);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Check if payment amount is valid
      const remainingAmount = invoice.subtotal - invoice.totalPaid;
      if (amount > remainingAmount) {
        throw new Error(
          `Payment amount exceeds remaining balance. Remaining: ${remainingAmount}`
        );
      }

      // Generate receipt number
      const sequence = await getNextSequence("receipt");
      const receiptNo = generateReceiptNumber(sequence);

      // Create payment record
      const payment = new Payment({
        invoice: invoiceId,
        amount,
        method,
        paymentType,
        receiptNo,
        receivedBy: user._id,
        note,
      });

      createdPayment = await payment.save({ session: session_db });

      // Update invoice totals and payment status
      const newTotalPaid = invoice.totalPaid + amount;
      const newPaymentStatus = calculatePaymentStatus(
        invoice.subtotal,
        newTotalPaid
      );

      await Invoice.findByIdAndUpdate(
        invoiceId,
        {
          totalPaid: newTotalPaid,
          paymentStatus: newPaymentStatus,
        },
        { session: session_db }
      );

      return payment;
    });

    // Fetch the created payment with populated data
    const paymentWithDetails = await Payment.findById(createdPayment._id)
      .populate("invoice", "invoiceNo subtotal totalPaid paymentStatus")
      .populate("receivedBy", "name");

    return NextResponse.json(paymentWithDetails, { status: 201 });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 400 }
    );
  } finally {
    await session_db.endSession();
  }
}
