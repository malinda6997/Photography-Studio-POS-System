import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Expense from "../../../../models/Expense";
import { requireAuth } from "../../../lib/auth";

export async function GET(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const category = searchParams.get("category");
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      query.date = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    if (
      category &&
      ["supplies", "utilities", "maintenance", "marketing", "other"].includes(
        category
      )
    ) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await Expense.find(query)
      .populate("createdBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    return NextResponse.json({
      expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Expenses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const body = await request.json();
    const { title, amount, category = "other", note } = body;

    if (!title || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Title and positive amount are required" },
        { status: 400 }
      );
    }

    const expense = new Expense({
      title,
      amount,
      category,
      note,
      createdBy: user.id,
    });

    await expense.save();

    // Populate creator data for response
    await expense.populate("createdBy", "name");

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Expense creation error:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
