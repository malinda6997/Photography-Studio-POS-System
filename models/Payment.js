import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: [true, "Invoice reference is required"],
  },
  amount: {
    type: Number,
    required: [true, "Payment amount is required"],
    min: [0, "Amount cannot be negative"],
  },
  method: {
    type: String,
    enum: ["cash", "bank", "card", "mobile"],
    required: [true, "Payment method is required"],
  },
  paymentType: {
    type: String,
    enum: ["advance", "partial", "full"],
    required: [true, "Payment type is required"],
  },
  receiptNo: {
    type: String,
    required: [true, "Receipt number is required"],
    unique: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Receiver is required"],
  },
  note: {
    type: String,
    trim: true,
  },
});

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);
