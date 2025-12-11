import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Category from "../../../../models/Category";
import { requireAuth } from "../../../lib/auth";

// GET - Fetch all categories
export async function GET(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly");

    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (activeOnly === "true") {
      query.isActive = true;
    }

    const categories = await Category.find(query).sort({ name: 1 });
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
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const body = await request.json();
    const { name, price, description } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    }

    const categoryData = {
      name: name.trim(),
      price: parseFloat(price),
      description: description?.trim() || "",
    };

    const category = new Category(categoryData);
    await category.save();

    console.log("✅ Category created successfully:", {
      name: category.name,
      price: category.price,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Categories POST error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    } else if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const body = await request.json();
    const { _id, name, price, description, isActive } = body;

    if (!_id || !name || price === undefined) {
      return NextResponse.json(
        { error: "ID, name and price are required" },
        { status: 400 }
      );
    }

    // Check if new name conflicts with existing category (excluding current one)
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: _id },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    }

    const updateData = {
      name: name.trim(),
      price: parseFloat(price),
      description: description?.trim() || "",
      updatedAt: new Date(),
    };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const category = await Category.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    console.log("✅ Category updated successfully:", {
      name: category.name,
      price: category.price,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Categories PUT error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 400 }
      );
    } else if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: validationErrors.join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(request) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  await dbConnect();

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    console.log("✅ Category deleted successfully:", category.name);

    return NextResponse.json({
      message: "Category deleted successfully",
      deletedCategory: category,
    });
  } catch (error) {
    console.error("Categories DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
