import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../../lib/dbConnect";
import Invoice from "../../../../models/Invoice";
import Frame from "../../../../models/Frame";
import Customer from "../../../../models/Customer";
import {
  getNextSequence,
  generateInvoiceNumber,
  calculatePaymentStatus,
} from "../../../../lib/server-utils";
import { requireAuth } from "../../../../lib/auth";

export async function GET(request) {
  console.log("📋 GET /api/invoices - Request received");

  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();
  console.log("📊 Database connected for invoices list");

  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let query = {};

    if (search) {
      query = {
        $or: [{ invoiceNo: { $regex: search, $options: "i" } }],
      };
    }

    if (status && ["pending", "partial", "paid"].includes(status)) {
      query.paymentStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoice.find(query)
      .populate("customer", "name mobile")
      .populate("createdBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    console.log(`📋 Found ${invoices.length} invoices out of ${total} total`);

    return NextResponse.json({
      invoices,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Invoices fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
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
    let createdInvoice;

    await session_db.withTransaction(async () => {
      const { customerId, items, advancePaid = 0, notes } = body;

      if (
        !customerId ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        throw new Error("Customer ID and items are required");
      }

      // Validate customer exists
      const customer = await Customer.findById(customerId).session(session_db);
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Calculate subtotal and validate frame quantities
      let subtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const { type, description, qty, unitPrice, refId } = item;

        if (
          !type ||
          !description ||
          !qty ||
          qty <= 0 ||
          !unitPrice ||
          unitPrice < 0
        ) {
          throw new Error("Invalid item data");
        }

        const itemTotal = qty * unitPrice;
        subtotal += itemTotal;

        if (type === "frame" && refId) {
          // Validate frame exists and has sufficient stock
          const frame = await Frame.findById(refId).session(session_db);
          if (!frame) {
            throw new Error(`Frame not found: ${description}`);
          }

          if (frame.quantity < qty) {
            throw new Error(
              `Insufficient stock for ${frame.name}. Available: ${frame.quantity}, Required: ${qty}`
            );
          }

          // Reduce frame quantity
          await Frame.findByIdAndUpdate(
            refId,
            { $inc: { quantity: -qty } },
            { session: session_db }
          );
        }

        processedItems.push({
          type,
          description,
          qty,
          unitPrice,
          total: itemTotal,
          refId: type === "frame" ? refId : undefined,
        });
      }

      // Generate invoice number
      const sequence = await getNextSequence("invoice");
      const invoiceNo = generateInvoiceNumber(sequence);

      // Calculate payment status
      const totalPaid = Math.min(advancePaid, subtotal);
      const paymentStatus = calculatePaymentStatus(subtotal, totalPaid);

      // Create invoice
      const invoice = new Invoice({
        invoiceNo,
        customer: customerId,
        items: processedItems,
        subtotal,
        advancePaid: totalPaid,
        totalPaid,
        paymentStatus,
        createdBy: user._id,
        notes,
      });

      createdInvoice = await invoice.save({ session: session_db });

      // Populate customer data for response
      await createdInvoice.populate("customer", "name mobile email");
      await createdInvoice.populate("createdBy", "name");
    });

    return NextResponse.json(createdInvoice, { status: 201 });
  } catch (error) {
    console.error("Invoice creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 400 }
    );
  } finally {
    await session_db.endSession();
  }
}

