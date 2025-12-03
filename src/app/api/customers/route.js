import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Customer from "../../../../models/Customer";
import { requireAuth } from "../../../../lib/auth";

export async function GET(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
        ],
      };
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Fetch customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { name, mobile, email, address, notes } = await request.json();

    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Name and mobile are required" },
        { status: 400 }
      );
    }

    // Trim and validate mobile number
    const trimmedMobile = mobile.trim();
    if (!trimmedMobile) {
      return NextResponse.json(
        { error: "Mobile number cannot be empty" },
        { status: 400 }
      );
    }

    // Check if customer with this mobile already exists
    const existingCustomer = await Customer.findOne({ mobile: trimmedMobile });
    if (existingCustomer) {
      return NextResponse.json(
        { error: `Customer with mobile ${trimmedMobile} already exists` },
        { status: 400 }
      );
    }

    const customerData = {
      name: name.trim(),
      mobile: trimmedMobile,
      email: email?.trim() || "",
      address: address?.trim() || "",
      notes: notes?.trim() || "",
      metadata: {
        totalInvoices: 0,
        totalSpent: 0,
        createdFrom: "new-transaction-page",
      },
    };

    const customer = new Customer(customerData);
    await customer.save();

    console.log("✅ Customer created successfully:", {
      name: customer.name,
      mobile: customer.mobile,
      hasEmail: !!customer.email,
      hasAddress: !!customer.address,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Customer creation error:", error);
    if (error.code === 11000) {
      // Handle duplicate key error specifically
      const duplicateField = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { error: `Customer with this ${duplicateField} already exists` },
        { status: 400 }
      );
    } else if (error.name === "ValidationError") {
      // Handle mongoose validation errors
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }
  }
}
