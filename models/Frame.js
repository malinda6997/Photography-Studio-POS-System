import mongoose from "mongoose";

const FrameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Frame name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Frame type is required"],
      enum: ["portrait", "landscape", "square", "custom"],
      default: "portrait",
    },
    dimensions: {
      type: String,
      required: [true, "Dimensions are required"],
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Price cannot be negative"],
    },
    stockQty: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      default: 5,
      min: [0, "Minimum stock level cannot be negative"],
    },
    material: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Frame || mongoose.model("Frame", FrameSchema);
