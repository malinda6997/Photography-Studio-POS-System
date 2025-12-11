import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import CustomIncome from "../../../../../../models/CustomIncome";
import { requireAdmin } from "../../../../../lib/auth";

export async function DELETE(request, { params }) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { id } = await params;
    const income = await CustomIncome.findByIdAndDelete(id);

    if (!income) {
      return NextResponse.json(
        { message: "Income not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Delete custom income error:", error);
    return NextResponse.json(
      { message: "Failed to delete income" },
      { status: 500 }
    );
  }
}
