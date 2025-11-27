// Seed admin user for testing
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
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

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seedAdmin() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@shine.com" });
    if (existingAdmin) {
      console.log("👤 Admin user already exists:");
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash("admin123", 12);

    // Create admin user
    const admin = new User({
      name: "Admin User",
      email: "admin@shine.com",
      passwordHash,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin user created successfully:");
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔚 Disconnected from MongoDB");
  }
}

seedAdmin();
