import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Counter name is required"],
    unique: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.Counter ||
  mongoose.model("Counter", CounterSchema);
