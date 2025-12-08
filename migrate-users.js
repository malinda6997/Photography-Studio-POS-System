// Migration script to add usernames to existing users
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

// Database connection
const dbConnect = async () => {
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

// User Schema (including both old and new fields)
const UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  passwordHash: String,
  role: String,
  createdAt: Date,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function migrateUsers() {
  try {
    await dbConnect();

    // Find users without usernames
    const usersWithoutUsername = await User.find({
      username: { $exists: false },
    });

    console.log(`Found ${usersWithoutUsername.length} users without usernames`);

    for (const user of usersWithoutUsername) {
      let username;

      // Create usernames based on email or role
      if (user.email === "admin@shine.com") {
        username = "admin";
      } else if (user.email === "staff@shine.com") {
        username = "staff";
      } else {
        // Generate username from email or name
        username = user.email
          ? user.email.split("@")[0]
          : user.name.toLowerCase().replace(/\s+/g, "");
      }

      // Update user with username
      await User.findByIdAndUpdate(user._id, { username });
      console.log(`Updated user ${user.name} with username: ${username}`);
    }

    // Also create default users if they don't exist
    const adminExists = await User.findOne({ username: "admin" });
    const staffExists = await User.findOne({ username: "staff" });

    if (!adminExists) {
      const adminPasswordHash = await bcrypt.hash("admin123", 12);
      const adminUser = new User({
        name: "Admin User",
        username: "admin",
        email: "admin@shine.com",
        passwordHash: adminPasswordHash,
        role: "admin",
      });
      await adminUser.save();
      console.log("Created admin user");
    }

    if (!staffExists) {
      const staffPasswordHash = await bcrypt.hash("staff123", 12);
      const staffUser = new User({
        name: "Staff User",
        username: "staff",
        email: "staff@shine.com",
        passwordHash: staffPasswordHash,
        role: "staff",
      });
      await staffUser.save();
      console.log("Created staff user");
    }

    console.log("Migration completed successfully!");

    // List all users
    const allUsers = await User.find({}, { passwordHash: 0 });
    console.log("Current users:", allUsers);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    mongoose.connection.close();
  }
}

migrateUsers();
