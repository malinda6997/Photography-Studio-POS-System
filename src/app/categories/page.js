"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../../components/ui/toast";
import { useConfirm } from "../../components/ui/confirm";
import Layout from "../components/Layout";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

export default function CategoriesManagement() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        toast.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Category created successfully!");
        await fetchCategories();
        setShowCreateModal(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Create category error:", error);
      toast.error("Failed to create category");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          _id: editingCategory._id,
          ...formData,
        }),
      });

      if (response.ok) {
        toast.success("Category updated successfully!");
        await fetchCategories();
        setShowEditModal(false);
        setEditingCategory(null);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Update category error:", error);
      toast.error("Failed to update category");
    }
  };

  const handleDelete = async (categoryId, categoryName) => {
    const confirmed = await confirm({
      title: "Delete Category",
      message: `Are you sure you want to delete category "${categoryName}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/categories?id=${categoryId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          toast.success(`Category "${categoryName}" deleted successfully`);
          await fetchCategories();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to delete category");
        }
      } catch (error) {
        console.error("Delete category error:", error);
        toast.error("Failed to delete category");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", price: "" });
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      price: category.price.toString(),
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-bold text-white">
                Categories Management
              </h1>
              <p className="mt-2 text-sm text-gray-300">
                Manage service categories with their pricing information
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Category
              </button>
            </div>
          </div>

          <div className="bg-gray-800 shadow rounded-lg mt-8">
            <div className="px-4 py-5 sm:p-6">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-white">
                    No categories
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    Get started by creating a new category.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                    >
                      <PlusIcon className="h-4 w-4 mr-2 inline" />
                      Add Category
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Category Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Price (LKR)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-600">
                      {categories.map((category) => (
                        <tr key={category._id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                              {category.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            LKR {category.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(category)}
                              className="text-indigo-400 hover:text-indigo-300 mr-4"
                            >
                              <PencilIcon className="h-4 w-4 inline" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(category._id, category.name)
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              <TrashIcon className="h-4 w-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                Create New Category
              </h3>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    placeholder="e.g., Portrait Photography"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (LKR)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                Edit Category
              </h3>
              <form onSubmit={handleEdit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    placeholder="e.g., Portrait Photography"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (LKR)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCategory(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Update Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
