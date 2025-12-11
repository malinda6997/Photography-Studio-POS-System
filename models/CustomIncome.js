import mongoose from "mongoose";

const CustomIncomeSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CustomIncome ||
  mongoose.model("CustomIncome", CustomIncomeSchema);
