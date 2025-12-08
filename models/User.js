import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: [true, "Password hash is required"],
  },
  role: {
    type: String,
    enum: ["admin", "staff"],
    default: "staff",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
