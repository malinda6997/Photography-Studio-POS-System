import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Customer from "../../../../../models/Customer";
import { requireAuth, requireAdmin } from "../../../../../lib/auth";

export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  // Only admin can view individual customer details
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  await dbConnect();

  try {
    const { id } = await params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, mobile, email, address, notes } = body;

    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Name and mobile are required" },
        { status: 400 }
      );
    }

    // Check if another customer has this mobile number
    const existingCustomer = await Customer.findOne({
      mobile: mobile.trim(),
      _id: { $ne: id },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Another customer with this mobile number already exists" },
        { status: 400 }
      );
    }

    const updateData = {
      name: name.trim(),
      mobile: mobile.trim(),
      email: email?.trim() || "",
      address: address?.trim() || "",
      notes: notes?.trim() || "",
    };

    const customer = await Customer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    console.log("✅ Customer updated successfully:", {
      name: customer.name,
      mobile: customer.mobile,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer update error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Customer with this mobile number already exists" },
        { status: 400 }
      );
    } else if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;
    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    console.log("✅ Customer deleted successfully:", customer.name);

    return NextResponse.json({
      message: "Customer deleted successfully",
      deletedCustomer: customer,
    });
  } catch (error) {
    console.error("Customer deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
