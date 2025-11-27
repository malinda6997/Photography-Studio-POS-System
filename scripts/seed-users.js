/* eslint-disable */
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// Database connection
const dbConnect = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }

  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/shine-art-pos";

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// User Schema
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

const seedUsers = async () => {
  try {
    await dbConnect();

    // Check if users already exist
    const existingAdmin = await User.findOne({ email: "admin@shine.com" });
    const existingStaff = await User.findOne({ email: "staff@shine.com" });

    const users = [];

    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash("admin123", 12);
      users.push({
        name: "Admin User",
        email: "admin@shine.com",
        passwordHash: adminPasswordHash,
        role: "admin",
      });
    }

    if (!existingStaff) {
      const staffPasswordHash = await bcrypt.hash("staff123", 12);
      users.push({
        name: "Staff User",
        email: "staff@shine.com",
        passwordHash: staffPasswordHash,
        role: "staff",
      });
    }

    if (users.length > 0) {
      await User.insertMany(users);
      console.log(`✅ Seeded ${users.length} users successfully`);

      users.forEach((user) => {
        console.log(`   - ${user.role}: ${user.email}`);
      });
    } else {
      console.log("✅ Demo users already exist in the database");
    }
  } catch (error) {
    console.error("❌ Error seeding users:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the seeding script
if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers };
