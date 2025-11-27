import mongoose from "mongoose";

const FrameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Frame name is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Price cannot be negative"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be negative"],
  },
  description: {
    type: String,
    trim: true,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Frame || mongoose.model("Frame", FrameSchema);
