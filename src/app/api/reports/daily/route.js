import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Payment from "../../../../../models/Payment";
import Expense from "../../../../../models/Expense";
import Invoice from "../../../../../models/Invoice";
import Frame from "../../../../../models/Frame";
import { requireAdmin } from "../../../../../lib/auth";

export async function GET(request) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const dateQuery = {
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    // Get daily income from payments
    const paymentsResult = await Payment.aggregate([
      {
        $match: dateQuery,
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get daily expenses
    const expensesResult = await Expense.aggregate([
      {
        $match: dateQuery,
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get invoice statistics for the day
    const invoiceStats = await Invoice.aggregate([
      {
        $match: dateQuery,
      },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$subtotal" },
        },
      },
    ]);

    // Get low stock items
    const lowStockItems = await Frame.find({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    }).sort({ quantity: 1 });

    const totalIncome = paymentsResult[0]?.totalIncome || 0;
    const totalExpenses = expensesResult[0]?.totalExpenses || 0;
    const netIncome = totalIncome - totalExpenses;

    const report = {
      date,
      income: {
        total: totalIncome,
        paymentsCount: paymentsResult[0]?.count || 0,
      },
      expenses: {
        total: totalExpenses,
        expensesCount: expensesResult[0]?.count || 0,
      },
      netIncome,
      invoices: {
        stats: invoiceStats,
        totalInvoices: invoiceStats.reduce((sum, stat) => sum + stat.count, 0),
      },
      lowStockItems: lowStockItems.map((frame) => ({
        id: frame._id,
        name: frame.name,
        category: frame.category,
        quantity: frame.quantity,
        lowStockThreshold: frame.lowStockThreshold,
      })),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Daily report error:", error);
    return NextResponse.json(
      { error: "Failed to generate daily report" },
      { status: 500 }
    );
  }
}
