import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import CustomExpense from "../../../../../models/CustomExpense";
import { requireAdmin } from "../../../../lib/auth";

export async function GET(request) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const expenses = await CustomExpense.find().sort({ date: -1 });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Get custom expenses error:", error);
    return NextResponse.json(
      { message: "Failed to fetch expenses" },
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

    const expense = await CustomExpense.create({
      description,
      amount: parseFloat(amount),
      date: new Date(date),
      createdBy: user.username,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Create custom expense error:", error);
    return NextResponse.json(
      { message: "Failed to create expense" },
      { status: 500 }
    );
  }
}
