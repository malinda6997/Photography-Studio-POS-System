import mongoose from "mongoose";

const InvoiceItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["service", "frame"],
    required: true,
  },
  description: {
    type: String,
    required: [true, "Item description is required"],
  },
  qty: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Price cannot be negative"],
  },
  total: {
    type: Number,
    required: [true, "Total is required"],
    min: [0, "Total cannot be negative"],
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Frame", // Only for frame items
  },
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: [true, "Invoice number is required"],
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required"],
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    required: [true, "Subtotal is required"],
    min: [0, "Subtotal cannot be negative"],
  },
  advancePaid: {
    type: Number,
    default: 0,
    min: [0, "Advance cannot be negative"],
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, "Total paid cannot be negative"],
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid"],
    default: "pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Creator is required"],
  },
  notes: {
    type: String,
    trim: true,
  },
});

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
