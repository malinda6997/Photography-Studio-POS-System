import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      unique: true, // Ensure mobile numbers are unique
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      totalInvoices: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      lastOrderDate: {
        type: Date,
      },
      createdFrom: {
        type: String,
        default: "manual",
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
