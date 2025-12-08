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
  discount: {
    type: Number,
    default: 0,
    min: [0, "Discount cannot be negative"],
    max: [100, "Discount cannot exceed 100%"],
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, "Discount amount cannot be negative"],
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

const InvoiceSchema = new mongoose.Schema(
  {
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
    totalDiscount: {
      type: Number,
      default: 0,
      min: [0, "Total discount cannot be negative"],
    },
    finalTotal: {
      type: Number,
      required: [true, "Final total is required"],
      min: [0, "Final total cannot be negative"],
    },
    advancePaid: {
      type: Number,
      default: 0,
      min: [0, "Advance cannot be negative"],
    },
    balanceDue: {
      type: Number,
      required: [true, "Balance due is required"],
      min: [0, "Balance due cannot be negative"],
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
    metadata: {
      hasDiscounts: {
        type: Boolean,
        default: false,
      },
      itemCount: {
        type: Number,
        default: 0,
      },
      createdFrom: {
        type: String,
        default: "legacy",
      },
      clientCalculations: {
        subtotal: Number,
        totalDiscount: Number,
        finalTotal: Number,
        balanceDue: Number,
      },
      lastModified: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
