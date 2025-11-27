// Server-side utility functions with database access
import Counter from "../models/Counter";
import dbConnect from "./dbConnect";

export async function getNextSequence(name) {
  await dbConnect();

  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter.seq;
}

export function generateInvoiceNumber(sequence) {
  const year = new Date().getFullYear();
  const paddedSeq = sequence.toString().padStart(5, "0");
  return `INV-${year}-${paddedSeq}`;
}

export function generateReceiptNumber(sequence) {
  const year = new Date().getFullYear();
  const paddedSeq = sequence.toString().padStart(4, "0");
  return `RCPT-${year}-${paddedSeq}`;
}

export function calculatePaymentStatus(subtotal, totalPaid) {
  if (totalPaid === 0) return "pending";
  if (totalPaid >= subtotal) return "paid";
  return "partial";
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
  }).format(amount);
}
