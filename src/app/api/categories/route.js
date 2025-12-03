import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Mock database for categories - in production, use MongoDB
let categories = [
  { _id: "1", name: "Portrait Photography", price: 5000 },
  { _id: "2", name: "Wedding Photography", price: 15000 },
  { _id: "3", name: "Event Photography", price: 8000 },
  { _id: "4", name: "Product Photography", price: 3000 },
];

let nextId = 5;

// Verify JWT token
function verifyToken(request) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return null;
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// GET - Fetch all categories
export async function GET(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, price } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Check if category name already exists
    const existingCategory = categories.find(
      (cat) => cat.name.toLowerCase() === name.toLowerCase()
    );
    if (existingCategory) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    }

    const newCategory = {
      _id: nextId.toString(),
      name,
      price: parseFloat(price),
    };
    nextId++;

    categories.push(newCategory);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { _id, name, price } = body;

    if (!_id || !name || price === undefined) {
      return NextResponse.json(
        { error: "ID, name and price are required" },
        { status: 400 }
      );
    }

    const categoryIndex = categories.findIndex((cat) => cat._id === _id);
    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if new name conflicts with existing category (excluding current one)
    const existingCategory = categories.find(
      (cat) => cat.name.toLowerCase() === name.toLowerCase() && cat._id !== _id
    );
    if (existingCategory) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    }

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      name,
      price: parseFloat(price),
    };

    return NextResponse.json(categories[categoryIndex]);
  } catch (error) {
    console.error("Categories PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const categoryIndex = categories.findIndex((cat) => cat._id === id);
    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    categories.splice(categoryIndex, 1);

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Categories DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
