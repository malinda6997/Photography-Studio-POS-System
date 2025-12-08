// Seed categories for the POS system
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// Database connection
const dbConnect = async () => {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/shine-art-pos";

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Category Schema
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    trim: true,
    minlength: [2, "Category name must be at least 2 characters long"],
    maxlength: [100, "Category name cannot exceed 100 characters"],
  },
  price: {
    type: Number,
    required: [true, "Category price is required"],
    min: [0, "Price cannot be negative"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
CategorySchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Index for better query performance
CategorySchema.index({ name: 1 });
CategorySchema.index({ isActive: 1 });

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

const categories = [
  {
    name: "Portrait Photography",
    price: 5000,
    description: "Professional portrait sessions for individuals and families",
  },
  {
    name: "Wedding Photography",
    price: 15000,
    description: "Complete wedding day coverage with professional editing",
  },
  {
    name: "Event Photography",
    price: 8000,
    description: "Corporate events, parties, and special occasion photography",
  },
  {
    name: "Product Photography",
    price: 3000,
    description: "Professional product shots for e-commerce and marketing",
  },
  {
    name: "Commercial Photography",
    price: 12000,
    description: "Business and commercial photography services",
  },
  {
    name: "Fashion Photography",
    price: 10000,
    description: "Fashion and modeling portfolio photography",
  },
];

async function seedCategories() {
  try {
    await dbConnect();

    console.log("🌱 Starting category seed...");

    // Clear existing categories
    await Category.deleteMany({});
    console.log("🗑️  Cleared existing categories");

    // Insert new categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories:`);

    createdCategories.forEach((cat) => {
      console.log(`   - ${cat.name}: ₹${cat.price}`);
    });

    console.log("🎉 Category seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  } finally {
    mongoose.connection.close();
  }
}

seedCategories();
