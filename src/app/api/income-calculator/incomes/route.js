import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import CustomIncome from "../../../../../models/CustomIncome";
import { requireAdmin } from "../../../../lib/auth";

export async function GET(request) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const incomes = await CustomIncome.find().sort({ date: -1 });
    return NextResponse.json(incomes);
  } catch (error) {
    console.error("Get custom incomes error:", error);
    return NextResponse.json(
      { message: "Failed to fetch incomes" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const body = await request.json();
    const { description, amount, date } = body;

    if (!description || !amount || !date) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const income = await CustomIncome.create({
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      createdBy: user.username,
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error("Create custom income error:", error);
    return NextResponse.json(
      { message: "Failed to create income" },
      { status: 500 }
    );
  }
}
