"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import Layout from "../components/Layout";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

export default function FramesPage() {
  const { user } = useAuth();
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingFrame, setEditingFrame] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "portrait",
    dimensions: "",
    unitPrice: 0,
    stockQty: 0,
    minStockLevel: 5,
    material: "",
    color: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchFrames();
  }, []);

  const fetchFrames = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/frames");
      if (response.ok) {
        const data = await response.json();
        setFrames(data);
      }
    } catch (error) {
      console.error("Failed to fetch frames:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingFrame
        ? `/api/frames/${editingFrame._id}`
        : "/api/frames";
      const method = editingFrame ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchFrames();
        handleCloseForm();
        alert(
          editingFrame
            ? "Frame updated successfully!"
            : "Frame created successfully!"
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save frame");
      }
    } catch (error) {
      console.error("Save frame error:", error);
      alert("Failed to save frame");
    }
  };

  const handleEdit = (frame) => {
    setFormData({
      name: frame.name,
      type: frame.type,
      dimensions: frame.dimensions,
      unitPrice: frame.unitPrice,
      stockQty: frame.stockQty,
      minStockLevel: frame.minStockLevel,
      material: frame.material || "",
      color: frame.color || "",
      description: frame.description || "",
      isActive: frame.isActive,
    });
    setEditingFrame(frame);
    setShowForm(true);
  };

  const handleDelete = async (frameId) => {
    if (!confirm("Are you sure you want to delete this frame?")) return;

    try {
      const response = await fetch(`/api/frames/${frameId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFrames();
        alert("Frame deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete frame");
      }
    } catch (error) {
      console.error("Delete frame error:", error);
      alert("Failed to delete frame");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFrame(null);
    setFormData({
      name: "",
      type: "portrait",
      dimensions: "",
      unitPrice: 0,
      stockQty: 0,
      minStockLevel: 5,
      material: "",
      color: "",
      description: "",
      isActive: true,
    });
  };

  const filteredFrames = frames.filter((frame) => {
    const matchesSearch =
      frame.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frame.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frame.dimensions.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || frame.type === filterType;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && frame.isActive) ||
      (filterStatus === "inactive" && !frame.isActive) ||
      (filterStatus === "low-stock" && frame.stockQty <= frame.minStockLevel);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStockStatus = (frame) => {
    if (frame.stockQty === 0)
      return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (frame.stockQty <= frame.minStockLevel)
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Frame Inventory
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your frame stock and pricing
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Frame
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search frames..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
                <option value="square">Square</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="low-stock">Low Stock</option>
              </select>

              <div className="flex justify-end">
                <span className="text-sm text-gray-600 self-center">
                  {filteredFrames.length} frame(s) found
                </span>
              </div>
            </div>
          </div>

          {/* Frames Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading frames...</p>
            </div>
          ) : filteredFrames.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No frames found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-500"
              >
                Add your first frame
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFrames.map((frame) => {
                const stockStatus = getStockStatus(frame);
                return (
                  <div
                    key={frame._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {frame.name}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {frame.type} • {frame.dimensions}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(frame)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(frame._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Price:
                          </span>
                          <span className="font-semibold">
                            LKR {frame.unitPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Stock:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {frame.stockQty}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                            >
                              {stockStatus.label}
                            </span>
                          </div>
                        </div>

                        {frame.material && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Material:
                            </span>
                            <span className="text-sm text-gray-600">
                              {frame.material}
                            </span>
                          </div>
                        )}

                        {frame.color && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Color:
                            </span>
                            <span className="text-sm text-gray-600">
                              {frame.color}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Status:
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              frame.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-700 text-gray-800"
                            }`}
                          >
                            {frame.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {frame.description && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-600">
                              {frame.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-600 w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    {editingFrame ? "Edit Frame" : "Add New Frame"}
                  </h3>
                  <button
                    onClick={handleCloseForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frame Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            type: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                        <option value="square">Square</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dimensions *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 8x10 inches"
                        value={formData.dimensions}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            dimensions: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price (LKR) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            unitPrice: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stockQty}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            stockQty: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Stock Level
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minStockLevel}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            minStockLevel: parseInt(e.target.value) || 5,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Material
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Wood, Metal, Plastic"
                        value={formData.material}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            material: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Black, White, Brown"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Additional details about the frame..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 block text-sm text-gray-900 dark:text-white"
                    >
                      Active (available for sale)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      {editingFrame ? "Update Frame" : "Add Frame"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

