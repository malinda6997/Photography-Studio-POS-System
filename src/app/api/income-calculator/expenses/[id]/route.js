import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import CustomExpense from "../../../../../../models/CustomExpense";
import { requireAdmin } from "../../../../../lib/auth";

export async function DELETE(request, { params }) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;
    const expense = await CustomExpense.findByIdAndDelete(id);

    if (!expense) {
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete custom expense error:", error);
    return NextResponse.json(
      { message: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
