import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  invoiceRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required"],
  },
  bookingDate: {
    type: Date,
    required: [true, "Booking date is required"],
  },
  slotTime: {
    type: String,
    required: [true, "Time slot is required"],
  },
  advancePaid: {
    type: Number,
    default: 0,
    min: [0, "Advance cannot be negative"],
  },
  fullPaid: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
