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
    const { name, mobile, email, notes } = await request.json();

    if (!name || !mobile) {
      return NextResponse.json(
        { error: "Name and mobile are required" },
        { status: 400 }
      );
    }

    const customer = new Customer({ name, mobile, email, notes });
    await customer.save();

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Customer creation error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Customer with this mobile already exists" },
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

